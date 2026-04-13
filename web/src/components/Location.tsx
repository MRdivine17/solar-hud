import { memo, useRef, useState } from 'react'
import * as React from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { HUDSettings, MinimapSettings } from '../types'

interface LocationProps {
  data: {
    street: string
    zone: string
    direction?: string
  }
  settings?: HUDSettings
  positioningMode?: boolean
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
  defaultPosition
}: {
  children: React.ReactNode
  positioningMode?: boolean
  hudSettings?: HUDSettings
  defaultPosition: { x: number; y: number }
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Get position key
  const positionKey = 'location'
  
  // Get position from settings or use default
  const savedPosition = hudSettings?.uiPositions?.[positionKey] || defaultPosition
  
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
      const rect = containerRef.current.getBoundingClientRect()
      const finalX = rect.left
      const finalY = rect.top
      
      const updatedSettings = {
        ...hudSettings,
        uiPositions: {
          ...(hudSettings.uiPositions || {}),
          [positionKey]: {
            x: finalX,
            y: finalY,
            width: 270,
            height: 60
          }
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
      
      console.log(`[${positionKey}] Position saved to localStorage:`, { x: finalX, y: finalY })
    }
    
    dragStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${savedPosition.x}px`,
        top: `${savedPosition.y}px`,
        cursor: positioningMode ? 'move' : 'default',
        outline: positioningMode ? '3px solid rgba(59, 130, 246, 0.8)' : 'none',
        outlineOffset: '3px',
        boxShadow: positioningMode ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
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

const Location = memo(({ data, settings, positioningMode }: LocationProps) => {
  if (!data.street && !data.zone && !positioningMode) return null

  const compassSettings: Partial<MinimapSettings> = settings?.minimap || {}
  
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

  // Get default position from App.tsx defaultSettings (above minimap)
  const defaultPosition = { x: 20, y: 560 }

  return (
    <DraggableLocationWrapper
      positioningMode={positioningMode}
      hudSettings={settings}
      defaultPosition={defaultPosition}
    >
      <div className="location" style={compassStyle}>
        <div className="location-icon">{data.direction || 'N'}</div>
        <div className="location-info">
          <div className="location-street">{data.street || 'Street Name'}</div>
          <div className="location-zone">{data.zone || 'Zone Name'}</div>
        </div>
      </div>
    </DraggableLocationWrapper>
  )
})

export default Location
