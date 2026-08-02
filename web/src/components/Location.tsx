import { memo, useRef, useState } from 'react'
import * as React from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { HUDSettings, MinimapSettings } from '../types'
import { readPosition, writePosition } from '../utils/layout'
import { useViewport } from '../hooks/useViewport'

interface LocationProps {
  data: {
    street: string
    zone: string
    direction?: string
    visible?: boolean
    minimapVisible?: boolean
  }
  settings?: HUDSettings
  positioningMode?: boolean
  /** Config.Minimap.moveCompassWhenHidden */
  moveCompassWhenHidden?: boolean
  /** Config.Minimap.size - how far to shift the compass when the radar is hidden */
  minimapHeight?: number
}

// Helper function
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

// Draggable Location Wrapper
const DraggableLocationWrapper = memo(({
  children,
  positioningMode,
  hudSettings,
  yOffset = 0
}: {
  children: React.ReactNode
  positioningMode?: boolean
  hudSettings?: HUDSettings
  yOffset?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Get position key
  const positionKey = 'location'

  // Resolve the stored design-space record against the live viewport.
  // Re-renders automatically when the game resolution changes.
  const vp = useViewport()
  const savedPosition = readPosition(hudSettings?.uiPositions, positionKey, vp)
  
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) return
    
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setIsDragging(true)
    
    const rect = target.getBoundingClientRect()
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !isDragging || !dragStartRef.current) return
    
    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y

    // Grid snapping (10px grid)
    const GRID_SIZE = 10
    const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE
    const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE

    // Update position directly via DOM for smooth dragging
    if (containerRef.current) {
      containerRef.current.style.left = `${snappedX}px`
      containerRef.current.style.top = `${snappedY}px`
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return
    
    const target = e.currentTarget
    target.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    
    // Save position immediately
    if (containerRef.current && hudSettings) {
      // Merge onto the LATEST saved settings, never onto the prop: the prop can
      // carry config.lua overrides (bars/cards force-hidden server-side) which
      // must never be written into the player's own saved settings.
      const rawSaved = localStorage.getItem('hudSettings')
      const baseSettings = rawSaved ? JSON.parse(rawSaved) : hudSettings

      const updatedSettings = {
        ...baseSettings,
        uiPositions: {
          ...(baseSettings.uiPositions || {}),
          // stored resolution-independently (design space + anchor)
          [positionKey]: writePosition(containerRef.current, vp, positionKey)
        }
      }
      
      // Update parent state via callback
      if ((window as any).updateHudSettings) {
        (window as any).updateHudSettings(updatedSettings)
      }
      
      // Save to localStorage immediately
      localStorage.setItem('hudSettings', JSON.stringify(updatedSettings))
      
      // Send to Lua server immediately
      fetch(`https://${GetParentResourceName()}/saveHUDSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).catch(() => {})
      
    }
    
    dragStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${savedPosition.left}px`,
        top: `${savedPosition.top + yOffset}px`,
        cursor: positioningMode ? 'move' : 'default',
        outline: positioningMode ? '1px dashed rgba(245, 165, 36, 0.65)' : 'none',
        outlineOffset: '3px',
        boxShadow: positioningMode ? '0 0 0 1px rgba(0,0,0,0.5), 0 0 26px -6px rgba(245, 165, 36, 0.45)' : 'none',
        pointerEvents: positioningMode ? 'auto' : 'none',
        touchAction: 'none',
        zIndex: positioningMode ? 10000 : 'auto',
        transition: positioningMode ? 'none' : 'all 0.2s ease'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  )
})

const Location = memo(({ data, settings, positioningMode, moveCompassWhenHidden = true, minimapHeight = 180 }: LocationProps) => {
  // Config.Minimap.showCompassOnFoot = false -> the client sends visible:false while on foot
  if (data.visible === false && !positioningMode) return null

  if (!data.street && !data.zone && !positioningMode) return null

  const compassSettings: Partial<MinimapSettings> = settings?.minimap || {}

  // Config.Minimap.moveCompassWhenHidden: slide the compass down into the
  // space the radar would have occupied when the radar is hidden
  const compassOffset =
    moveCompassWhenHidden && data.minimapVisible === false && !positioningMode
      ? Math.round(minimapHeight * 0.9)
      : 0

  // Get border radius style
  const getBorderRadiusStyle = () => {
    const radius = compassSettings.compassBorderRadius || 'rounded'
    if (radius === 'square') return '4px'
    if (radius === 'circle') return '50%'
    return '12px' // rounded
  }

  const compassStyle = {
    borderRadius: getBorderRadiusStyle(),
    backgroundColor: compassSettings.compassBgColor || '#00000080',
    color: compassSettings.compassPrimaryColor || '#ffffff',
    boxShadow: `0 0 8px ${compassSettings.compassShadowColor || '#000000'}80`
  }

  return (
    <DraggableLocationWrapper
      positioningMode={positioningMode}
      hudSettings={settings}
      yOffset={compassOffset}
    >
      <div className="location" style={compassStyle}>
        {compassSettings.showCompassDirection !== false && (
          <div className="location-icon">{data.direction || 'N'}</div>
        )}
        <div className="location-info">
          {/* Empty street/zone means Config.Minimap.showStreetName / showZoneName is off */}
          {(data.street || positioningMode) && (
            <div className="location-street">{data.street || 'Street Name'}</div>
          )}
          {(data.zone || positioningMode) && (
            <div className="location-zone">{data.zone || 'Zone Name'}</div>
          )}
        </div>
      </div>
    </DraggableLocationWrapper>
  )
})

export default Location
