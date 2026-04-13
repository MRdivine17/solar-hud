import { memo, useRef, useState } from 'react'
import * as React from 'react'
import { WeaponData, PlayerInfoSettings } from '../types'
import { getPositionFromBottomRight } from '../utils/responsive'
import './WeaponDisplay.css'

interface WeaponDisplayProps {
  weapon: WeaponData
  settings?: PlayerInfoSettings
  position?: { x: number; y: number }
  positioningMode?: boolean
  hudSettings?: any
}

// Helper functions
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

// Draggable Weapon Display Wrapper
const DraggableWeaponWrapper = memo(({ 
  children, 
  positioningMode, 
  hudSettings, 
  layoutStyle,
  defaultPosition,
  width = 350,
  height = 60
}: {
  children: React.ReactNode
  positioningMode?: boolean
  hudSettings?: any
  layoutStyle: string
  defaultPosition: { x: number; y: number }
  width?: number
  height?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  // Get layout-specific position key
  const positionKey = `weaponDisplay_${layoutStyle}`
  
  // Get position from settings or use default
  const savedPosition = hudSettings?.uiPositions?.[positionKey] || defaultPosition
  
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) {
      return
    }
    
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
            width: width,
            height: height
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

const WeaponDisplay = memo(({ weapon, settings, positioningMode, hudSettings }: WeaponDisplayProps) => {
  // Always render in positioning mode to show where weapon will appear
  const shouldRender = weapon.hasWeapon || positioningMode
  if (!shouldRender) return null

  const defaultColors = {
    iconColor: '#ffffff',
    textColor: '#ffffff',
    labelColor: '#999999',
    bgColor: '#0a0a0a'
  }

  const defaultSettings: PlayerInfoSettings = {
    enabled: true,
    layoutStyle: 'miniature',
    cardStyle: 'rounded',
    themeMode: 'dark',
    bgColor: '#000000',
    iconBgColor: '#1a1a1a',
    contentBgColor: '#0a0a0a',
    transparency: 85,
    position: { x: 12, y: 12 },
    scale: 100,
    showId: true,
    showTime: true,
    showJob: true,
    showBank: true,
    showCash: true,
    showDirty: false,
    showVoice: true,
    showWeather: true,
    showServerInfo: true,
    serverName: 'Server Name',
    serverLogo: '',
    weatherIconType: 'fontawesome',
    weatherIconPath: '',
    showLogo: false,
    logoScale: 100,
    logoPosition: { x: 50, y: 10 },
    idColors: defaultColors,
    timeColors: defaultColors,
    jobColors: defaultColors,
    bankColors: defaultColors,
    cashColors: defaultColors,
    dirtyColors: defaultColors,
    voiceColors: { ...defaultColors, iconColor: '#00ff00', textColor: '#00ff00' }
  }

  const activeSettings = settings || defaultSettings
  const transparencyValue = activeSettings.transparency || 85
  const bgOpacity = 0.3 + (transparencyValue / 100) * 0.6

  const hexToRgba = (hex: string | undefined, alpha: number) => {
    if (!hex || typeof hex !== 'string' || hex.length < 7) {
      return `rgba(0, 0, 0, ${alpha})`
    }
    
    const mixFactor = transparencyValue / 100
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    
    r = Math.round(r * mixFactor + 255 * (1 - mixFactor) * 0.3)
    g = Math.round(g * mixFactor + 255 * (1 - mixFactor) * 0.3)
    b = Math.round(b * mixFactor + 255 * (1 - mixFactor) * 0.3)
    
    const finalAlpha = 0.3 + (transparencyValue / 100) * 0.6
    return `rgba(${r}, ${g}, ${b}, ${finalAlpha})`
  }

  // Get resource name dynamically from window
  const getResourceName = () => {
    // Use GetParentResourceName if available (FiveM NUI)
    if ((window as any).GetParentResourceName) {
      return (window as any).GetParentResourceName()
    }
    // Extract from NUI URL as fallback
    const match = window.location.href.match(/cfx-nui-([^\/]+)/)
    if (match) return match[1]
    // Final fallback - extract from any nui:// URL
    const nuiMatch = window.location.href.match(/nui:\/\/([^\/]+)/)
    return nuiMatch ? nuiMatch[1] : ''
  }
  
  // Use absolute NUI path for FiveM
  const resourceName = getResourceName()
  const weaponImagePath = `https://cfx-nui-${resourceName}/web/img/weapon-images/${weapon.weaponName}.webp`
  const layoutStyle = activeSettings.layoutStyle || 'miniature'

  const getCardStyle = () => {
    const style = activeSettings.cardStyle
    
    if (style === 'rounded') {
      return { clipPath: 'none', borderRadius: '8px' }
    } else if (style === 'square') {
      return { clipPath: 'none', borderRadius: '0px' }
    } else if (style === 'angled') {
      return {
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)',
        borderRadius: '8px 0 0 8px'
      }
    } else if (style === 'hexagon') {
      return {
        clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)',
        borderRadius: '0'
      }
    }
    
    return { clipPath: 'none', borderRadius: '8px' }
  }

  const cardStyleProps = getCardStyle()

  // Modern HUD Layout - Icon square on RIGHT, info rectangle on LEFT
  if (layoutStyle === 'modern') {
    return (
      <DraggableWeaponWrapper
        positioningMode={positioningMode}
        hudSettings={hudSettings}
        layoutStyle="modern"
        defaultPosition={getPositionFromBottomRight(370, 350)}
        width={350}
        height={60}
      >
        <div className="weapon-card-row">
          <div 
            className="weapon-info-rect" 
            style={{ background: hexToRgba(activeSettings.contentBgColor, bgOpacity) }}
          >
            <span 
              className={`weapon-ammo-value ${weapon.isReloading ? 'reloading' : ''}`}
              style={{ color: defaultColors.textColor }}
            >
              {weapon.isReloading ? 'RELOADING...' : (positioningMode ? '30 / 120' : `${weapon.ammo} / ${weapon.maxAmmo}`)}
            </span>
            <span 
              className="weapon-name-label" 
              style={{ color: defaultColors.labelColor }}
            >
              {positioningMode ? 'WEAPON NAME' : weapon.weaponLabel}
            </span>
          </div>
          <div 
            className="weapon-icon-square" 
            style={{ background: hexToRgba(activeSettings.iconBgColor, bgOpacity) }}
          >
            <img 
              src={weaponImagePath} 
              alt={weapon.weaponLabel}
              className="weapon-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      </DraggableWeaponWrapper>
    )
  }

  // Grid Layout - Icon on LEFT, details on RIGHT with accent bar
  if (layoutStyle === 'grid') {
    return (
      <DraggableWeaponWrapper
        positioningMode={positioningMode}
        hudSettings={hudSettings}
        layoutStyle="grid"
        defaultPosition={getPositionFromBottomRight(370, 350)}
        width={350}
        height={60}
      >
        <div 
          className="weapon-grid-card" 
          style={{ background: hexToRgba(activeSettings.contentBgColor, bgOpacity), ...cardStyleProps }}
        >
          <div className="weapon-grid-accent" style={{ background: '#fb923c' }}></div>
          <img 
            src={weaponImagePath} 
            alt={weapon.weaponLabel}
            className="weapon-grid-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="weapon-grid-info">
            <span 
              className="weapon-grid-name" 
              style={{ color: defaultColors.labelColor }}
            >
              {positioningMode ? 'WEAPON NAME' : weapon.weaponLabel}
            </span>
            <span 
              className={`weapon-grid-ammo ${weapon.isReloading ? 'reloading' : ''}`}
              style={{ color: defaultColors.textColor }}
            >
              {weapon.isReloading ? 'RELOADING...' : (positioningMode ? 'AMMO: 30 / 120' : `AMMO: ${weapon.ammo} / ${weapon.maxAmmo}`)}
            </span>
          </div>
        </div>
      </DraggableWeaponWrapper>
    )
  }

  // Miniature Layout - Icon on LEFT, ammo on RIGHT
  return (
    <DraggableWeaponWrapper
      positioningMode={positioningMode}
      hudSettings={hudSettings}
      layoutStyle="miniature"
      defaultPosition={getPositionFromBottomRight(370, 350)}
      width={350}
      height={60}
    >
      <div 
        className="weapon-mini-card" 
        style={{ background: hexToRgba(activeSettings.contentBgColor, bgOpacity), ...cardStyleProps }}
      >
        <img 
          src={weaponImagePath} 
          alt={weapon.weaponLabel}
          className="weapon-mini-image"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <div className="weapon-mini-content">
          <span 
            className={`weapon-mini-ammo ${weapon.isReloading ? 'reloading' : ''}`}
            style={{ color: defaultColors.textColor }}
          >
            {weapon.isReloading ? 'RELOADING' : (positioningMode ? '30 / 120' : `${weapon.ammo} / ${weapon.maxAmmo}`)}
          </span>
        </div>
      </div>
    </DraggableWeaponWrapper>
  )
})

WeaponDisplay.displayName = 'WeaponDisplay'

export default WeaponDisplay
