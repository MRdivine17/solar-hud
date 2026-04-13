import { memo, useRef, useState } from 'react'
import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShield, faBurger, faBottleWater, faLungs, faBrain } from '@fortawesome/free-solid-svg-icons'
import { HUDData, HUDSettings, StatusBarSettings } from '../types'
import { getPositionFromBottom, applyResponsivePosition } from '../utils/responsive'
import './StatusBars.css'

interface StatusBarsProps {
  data: HUDData
  settings?: HUDSettings
  positioningMode?: boolean
}

// Helper functions
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

// Individual Status Bar Component for separate dragging
const StatusBarCard = memo(({ 
  children, 
  positioningMode, 
  hudSettings, 
  barId, 
  layoutKey,
  defaultPosition,
  width = 56,
  height = 56
}: {
  children: (size: { width: number; height: number }) => React.ReactNode
  positioningMode?: boolean
  hudSettings?: HUDSettings
  barId: string
  layoutKey: string
  defaultPosition: { x: number; y: number }
  width?: number
  height?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ width: number; height: number; startX: number; startY: number } | null>(null)

  // Get layout-specific position key
  const positionKey = `${barId}_${layoutKey}`
  
  // Get position from settings or use default
  const uiPositions = hudSettings?.uiPositions as any
  const savedPosition = uiPositions?.[positionKey] || defaultPosition
  
  // Get saved size or use default
  const savedSize = savedPosition.width && savedPosition.height 
    ? { width: savedPosition.width, height: savedPosition.height }
    : { width, height }
  
  // Apply responsive positioning - converts to current viewport
  const responsivePosition = applyResponsivePosition(savedPosition)

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) return
    
    // Check if clicking on resize handle
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return // Let resize handle handle it
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

  const handleResizeStart: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings || !containerRef.current) return
    
    e.stopPropagation()
    e.preventDefault()
    
    const target = e.currentTarget.parentElement as HTMLDivElement
    target.setPointerCapture(e.pointerId)
    setIsResizing(true)
    
    const rect = containerRef.current.getBoundingClientRect()
    resizeStartRef.current = {
      width: rect.width,
      height: rect.height,
      startX: e.clientX,
      startY: e.clientY
    }
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode) return
    
    // Handle dragging
    if (isDragging && dragStartRef.current) {
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
    
    // Handle resizing
    if (isResizing && resizeStartRef.current && containerRef.current) {
      const deltaX = e.clientX - resizeStartRef.current.startX
      const deltaY = e.clientY - resizeStartRef.current.startY
      
      // Calculate new size (maintain aspect ratio)
      const delta = Math.max(deltaX, deltaY)
      let newWidth = resizeStartRef.current.width + delta
      let newHeight = resizeStartRef.current.height + delta
      
      // Clamp size between 30px and 120px
      newWidth = Math.max(30, Math.min(120, newWidth))
      newHeight = Math.max(30, Math.min(120, newHeight))
      
      // Grid snapping for size
      const GRID_SIZE = 4
      newWidth = Math.round(newWidth / GRID_SIZE) * GRID_SIZE
      newHeight = Math.round(newHeight / GRID_SIZE) * GRID_SIZE
      
      // Update DOM directly for smooth resizing
      containerRef.current.style.width = `${newWidth}px`
      containerRef.current.style.height = `${newHeight}px`
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging && !isResizing) return
    
    const target = e.currentTarget
    target.releasePointerCapture(e.pointerId)
    
    // Save position and/or size immediately
    if (containerRef.current && hudSettings) {
      const rect = containerRef.current.getBoundingClientRect()
      const finalX = rect.left
      const finalY = rect.top
      const finalWidth = rect.width
      const finalHeight = rect.height
      
      const updatedSettings = {
        ...hudSettings,
        uiPositions: {
          ...(hudSettings.uiPositions || {}),
          [positionKey]: {
            x: finalX,
            y: finalY,
            width: finalWidth,
            height: finalHeight
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
      
      console.log(`[${positionKey}] Position & size saved:`, { x: finalX, y: finalY, width: finalWidth, height: finalHeight })
      
      // Verify localStorage save
      const savedData = localStorage.getItem('hudSettings')
      if (savedData) {
        const parsed = JSON.parse(savedData)
        console.log(`[${positionKey}] Verified in localStorage:`, parsed.uiPositions?.[positionKey])
      }
    }
    
    setIsDragging(false)
    setIsResizing(false)
    dragStartRef.current = null
    resizeStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${responsivePosition.x}px`,
        top: `${responsivePosition.y}px`,
        width: `${savedSize.width}px`,
        height: `${savedSize.height}px`,
        cursor: positioningMode ? (isResizing ? 'nwse-resize' : 'move') : 'default',
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
      {children({ width: savedSize.width, height: savedSize.height })}
      
      {/* Resize handle (bottom-right corner) */}
      {positioningMode && (
        <div
          className="resize-handle"
          onPointerDown={handleResizeStart}
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '16px',
            height: '16px',
            background: '#3b82f6',
            border: '2px solid #ffffff',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 10001,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        />
      )}
    </div>
  )
})

const StatusBars = memo(({ data, settings, positioningMode }: StatusBarsProps) => {
  const defaultSettings: HUDSettings = {
    health: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#ffffff00', progressColor: '#ffffff', iconColor: '#ffffff', shadowColor: '#00000080' },
    armor: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#134e4a80', progressColor: '#14b8a6', iconColor: '#99f6e4', shadowColor: '#00000080' },
    hunger: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#78350f80', progressColor: '#f59e0b', iconColor: '#fde68a', shadowColor: '#00000080' },
    thirst: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1e3a8a80', progressColor: '#60a5fa', iconColor: '#bfdbfe', shadowColor: '#00000080' },
    oxygen: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#00bcd480', progressColor: '#00bcd4', iconColor: '#80deea', shadowColor: '#00000080' },
    stress: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#9c27b080', progressColor: '#9c27b0', iconColor: '#ce93d8', shadowColor: '#00000080' },
    style: 'progressOutline',
    borderRadius: 'fullyRounded',
    minimap: { size: 'small', shape: 'square', borderRadius: 12, position: { x: 20, y: 80 } }
  }

  const currentSettings = settings || defaultSettings
  const style = currentSettings.style || 'progressOutline'
  const borderRadius = currentSettings.borderRadius || 'fullyRounded'
  
  // Create layout key from style + borderRadius
  const layoutKey = `${style}_${borderRadius}`

  // Define all bars (show all in positioning mode)
  const allBars = [
    { name: 'health', value: data.health, icon: faHeart, visible: true, alwaysShow: true },
    { name: 'armor', value: data.armor, icon: faShield, visible: true, alwaysShow: false},
    { name: 'hunger', value: data.hunger, icon: faBurger, visible: true, alwaysShow: true },
    { name: 'thirst', value: data.thirst, icon: faBottleWater, visible: true, alwaysShow: true },
    { name: 'oxygen', value: data.oxygen, icon: faLungs, visible: data.showOxygen === true, alwaysShow: false },
    { name: 'stress', value: data.stress || 0, icon: faBrain, visible: (data.stress || 0) > 0, alwaysShow: false },
  ]

  // Filter bars based on visibility (or show all in positioning mode)
  const bars = positioningMode ? allBars : allBars.filter(bar => {
    const barSettings = currentSettings[bar.name as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>] as StatusBarSettings
    if (bar.alwaysShow) {
      return bar.visible && barSettings.visible
    }
    return bar.visible && 
           barSettings.visible && 
           bar.value >= barSettings.visibleMin && 
           bar.value <= barSettings.visibleMax
  })

  const getBorderRadiusStyle = () => {
    if (borderRadius === 'fullyRounded') return '50%'
    if (borderRadius === 'slightlyRounded') return '12px'
    return '4px'
  }

  // Default positions for each bar - responsive based on viewport
  const defaultPositions: Record<string, { x: number; y: number }> = {
    health: getPositionFromBottom(30, 310),
    armor: getPositionFromBottom(90, 310),
    hunger: getPositionFromBottom(150, 310),
    thirst: getPositionFromBottom(210, 310),
    oxygen: getPositionFromBottom(270, 310),
    stress: getPositionFromBottom(330, 310)
  }
  
  const getDefaultPosition = (barName: string) => {
    // Use responsive positioning from App.tsx defaults
    const vh = window.innerHeight
    const baseY = vh - 80 // 80px from bottom
    const spacing = 60
    const barIndex = ['health', 'armor', 'hunger', 'thirst', 'oxygen', 'stress'].indexOf(barName)
    return defaultPositions[barName] || { x: 30 + (barIndex * spacing), y: baseY }
  }

  // Progress Outline (circular/square with ring)
  if (style === 'progressOutline') {
    return (
      <>
        {bars.map((bar) => {
          const barSettings = currentSettings[bar.name as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>] as StatusBarSettings
          
          // Fully Rounded = Circle
          if (borderRadius === 'fullyRounded') {

            return (
              <StatusBarCard
                key={bar.name}
                positioningMode={positioningMode}
                hudSettings={settings}
                barId={bar.name}
                layoutKey={layoutKey}
                defaultPosition={getDefaultPosition(bar.name)}
                width={48}
                height={48}
              >
                {({ width: containerWidth, height: _containerHeight }) => {
                  const scale = containerWidth / 48
                  const radius = 20
                  const circumference = 2 * Math.PI * radius
                  const offset = circumference - (bar.value / 100) * circumference
                  const innerCircleSize = 34 * scale
                  const iconSize = `${18 * scale}px`

                  return (
                    <div className="status-bar" style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <svg 
                        width="100%" 
                        height="100%" 
                        viewBox="0 0 48 48" 
                        preserveAspectRatio="xMidYMid meet"
                        style={{ position: 'absolute', transform: 'rotate(-90deg)', top: 0, left: 0 }}
                      >
                        <circle cx="24" cy="24" r={radius} fill="none" stroke="rgba(0, 0, 0, 0.6)" strokeWidth="3" />
                        <circle
                          cx="24" cy="24" r={radius} fill="none"
                          stroke={barSettings.progressColor}
                          strokeWidth="5"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          style={{ 
                            transition: 'stroke-dashoffset 0.3s ease',
                            filter: `drop-shadow(0 0 4px ${barSettings.shadowColor})`
                          }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute',
                        width: `${innerCircleSize}px`,
                        height: `${innerCircleSize}px`,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        background: barSettings.bgColor,
                        zIndex: 0
                      }}></div>
                      <FontAwesomeIcon 
                        icon={bar.icon} 
                        className="status-icon" 
                        style={{ 
                          color: barSettings.iconColor,
                          fontSize: iconSize
                        }} 
                      />
                    </div>
                  )
                }}
              </StatusBarCard>
            )
          }
          
          // Slightly Rounded or Square

          return (
            <StatusBarCard
              key={bar.name}
              positioningMode={positioningMode}
              hudSettings={settings}
              barId={bar.name}
              layoutKey={layoutKey}
              defaultPosition={getDefaultPosition(bar.name)}
              width={48}
              height={48}
            >
              {({ width: containerWidth, height: _containerHeight }) => {
                const scale = containerWidth / 48
                const strokeWidth = 4
                const rectSize = 48 - strokeWidth * 2
                const perimeter = rectSize * 4
                const progressLength = (bar.value / 100) * perimeter
                const cornerRadius = borderRadius === 'slightlyRounded' ? 8 : 0
                const innerBoxSize = 34 * scale
                const innerCornerRadius = borderRadius === 'slightlyRounded' ? 8 : 2
                const iconSize = `${18 * scale}px`

                return (
                  <div className="status-bar" style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <svg 
                      width="100%" 
                      height="100%" 
                      viewBox="0 0 48 48"
                      preserveAspectRatio="xMidYMid meet"
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                      <rect
                        x={strokeWidth}
                        y={strokeWidth}
                        width={rectSize}
                        height={rectSize}
                        rx={cornerRadius}
                        ry={cornerRadius}
                        fill="none"
                        stroke="rgba(0, 0, 0, 0.6)"
                        strokeWidth={strokeWidth - 1}
                      />
                      <rect
                        x={strokeWidth}
                        y={strokeWidth}
                        width={rectSize}
                        height={rectSize}
                        rx={cornerRadius}
                        ry={cornerRadius}
                        fill="none"
                        stroke={barSettings.progressColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={perimeter}
                        strokeDashoffset={perimeter - progressLength}
                        style={{ 
                          transition: 'stroke-dashoffset 0.3s ease',
                          filter: `drop-shadow(0 0 4px ${barSettings.shadowColor})`
                        }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      width: `${innerBoxSize}px`,
                      height: `${innerBoxSize}px`,
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: `${innerCornerRadius}px`,
                      background: barSettings.bgColor,
                      zIndex: 0
                    }}></div>
                    <FontAwesomeIcon 
                      icon={bar.icon} 
                      className="status-icon" 
                      style={{ 
                        color: barSettings.iconColor,
                        fontSize: iconSize
                      }} 
                    />
                  </div>
                )
              }}
            </StatusBarCard>
          )
        })}
      </>
    )
  }

  // Percentages
  if (style === 'percentages') {
    return (
      <>
        {bars.map((bar) => {
          const barSettings = currentSettings[bar.name as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>] as StatusBarSettings
          return (
            <StatusBarCard
              key={bar.name}
              positioningMode={positioningMode}
              hudSettings={settings}
              barId={bar.name}
              layoutKey={layoutKey}
              defaultPosition={getDefaultPosition(bar.name)}
              width={56}
              height={56}
            >
              {({ width: containerWidth, height: _containerHeight }) => {
                const iconSize = `${(containerWidth / 56) * 18}px`
                const fontSize = `${(containerWidth / 56) * 12}px`
                
                return (
                  <div className="status-bar-percentage" style={{ width: '100%', height: '100%' }}>
                    <div 
                      className="percentage-container"
                      style={{
                        background: barSettings.bgColor,
                        borderRadius: getBorderRadiusStyle(),
                        border: `2px solid ${barSettings.progressColor}60`,
                        boxShadow: `0 0 8px ${barSettings.shadowColor}`,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <FontAwesomeIcon 
                        icon={bar.icon} 
                        style={{ 
                          color: barSettings.iconColor, 
                          fontSize: iconSize,
                          filter: `drop-shadow(0 1px 2px ${barSettings.shadowColor})`
                        }}
                      />
                      <span 
                        style={{ 
                          color: barSettings.progressColor, 
                          fontSize: fontSize, 
                          fontWeight: 'bold',
                          textShadow: `0 1px 2px ${barSettings.shadowColor}`
                        }}
                      >
                        {Math.round(bar.value)}%
                      </span>
                    </div>
                  </div>
                )
              }}
            </StatusBarCard>
          )
        })}
      </>
    )
  }

  // Progress Bar
  if (style === 'progressBar') {
    const getBarBorderRadius = () => {
      if (borderRadius === 'fullyRounded') return '12px'
      if (borderRadius === 'slightlyRounded') return '8px'
      return '4px'
    }

    // For progressBar style, use vertical stacking starting from a visible position
    const getProgressBarDefaultPosition = (_barName: string, index: number) => {
      // Start from bottom of screen and stack vertically upward
      const vh = window.innerHeight
      return { x: 30, y: vh - 130 + (index * 30) }
    }

    return (
      <>
        {bars.map((bar, index) => {
          const barSettings = currentSettings[bar.name as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>] as StatusBarSettings
          return (
            <StatusBarCard
              key={bar.name}
              positioningMode={positioningMode}
              hudSettings={settings}
              barId={bar.name}
              layoutKey={layoutKey}
              defaultPosition={getProgressBarDefaultPosition(bar.name, index)}
              width={200}
              height={24}
            >
              {({ width: _containerWidth, height: containerHeight }) => {
                const iconSize = `${(containerHeight / 24) * 16}px`
                const iconWidth = (containerHeight / 24) * 20
                
                return (
                  <div className="status-bar-horizontal" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon 
                      icon={bar.icon} 
                      style={{ 
                        color: barSettings.iconColor, 
                        fontSize: iconSize,
                        filter: `drop-shadow(0 1px 2px ${barSettings.shadowColor})`,
                        width: `${iconWidth}px`,
                        textAlign: 'center',
                        flexShrink: 0
                      }}
                    />
                    <div 
                      className="progress-bar-container" 
                      style={{ 
                        borderRadius: getBarBorderRadius(),
                        background: barSettings.bgColor,
                        border: `2px solid ${barSettings.progressColor}40`,
                        flex: 1,
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="progress-bar-fill"
                        style={{
                          width: `${bar.value}%`,
                          background: barSettings.progressColor,
                          borderRadius: getBarBorderRadius(),
                          boxShadow: `0 0 8px ${barSettings.shadowColor}`,
                          transition: 'width 0.3s ease',
                          height: '100%'
                        }}
                      ></div>
                    </div>
                  </div>
                )
              }}
            </StatusBarCard>
          )
        })}
      </>
    )
  }

  // Progress Fill
  return (
    <>
      {bars.map((bar) => {
        const barSettings = currentSettings[bar.name as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>] as StatusBarSettings
        const fillHeight = bar.value

        return (
          <StatusBarCard
            key={bar.name}
            positioningMode={positioningMode}
            hudSettings={settings}
            barId={bar.name}
            layoutKey={layoutKey}
            defaultPosition={getDefaultPosition(bar.name)}
            width={56}
            height={56}
          >
            {({ width: containerWidth, height: _containerHeight }) => {
              const iconSize = `${(containerWidth / 56) * 18}px`
              
              return (
                <div className="status-bar-fill" style={{ width: '100%', height: '100%' }}>
                  <div 
                    className="fill-container"
                    style={{
                      borderRadius: getBorderRadiusStyle(),
                      background: barSettings.bgColor,
                      border: `2px solid ${barSettings.progressColor}40`,
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      className="fill-progress"
                      style={{
                        height: `${fillHeight}%`,
                        background: barSettings.progressColor,
                        borderRadius: getBorderRadiusStyle(),
                        boxShadow: `0 0 8px ${barSettings.shadowColor}`,
                        transition: 'height 0.3s ease',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0
                      }}
                    ></div>
                    <FontAwesomeIcon 
                      icon={bar.icon} 
                      style={{ 
                        color: barSettings.iconColor,
                        fontSize: iconSize,
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2,
                        filter: `drop-shadow(0 2px 4px ${barSettings.shadowColor})`
                      }}
                    />
                  </div>
                </div>
              )
            }}
          </StatusBarCard>
        )
      })}
    </>
  )
})

export default StatusBars
