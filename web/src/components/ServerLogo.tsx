import { useState, useEffect, useRef } from 'react'
import './ServerLogo.css'

interface LogoConfig {
  enabled: boolean
  serverName: string
  logoPath: string
  scale: number
  position: {
    x: number | string
    y: number
  }
}

interface ServerLogoProps {
  positioningMode?: boolean
  hudSettings?: any
}

// Helper function
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

const ServerLogo = ({ positioningMode, hudSettings }: ServerLogoProps) => {
  const [config, setConfig] = useState<LogoConfig | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ scale: number; mouseX: number; mouseY: number } | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (data.action === 'setLogoConfig') {
        // console.log('[ServerLogo] Config received:', data.data)
        setConfig(data.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Check if logo should be shown (config enabled AND user setting enabled)
  const showLogo = hudSettings?.playerInfo?.showLogo ?? true // Default to true if not set
  
  if (!config || !config.enabled || !showLogo) return null

  // Get saved position from hudSettings or use config default
  const savedPosition = hudSettings?.uiPositions?.serverLogo || config.position
  const savedScale = hudSettings?.serverLogoScale || config.scale

  // Construct proper NUI URL for the logo
  const getLogoUrl = () => {
    const resourceName = GetParentResourceName()
    let logoPath = config.logoPath
    
    // Remove leading slash if present
    if (logoPath.startsWith('/')) {
      logoPath = logoPath.substring(1)
    }
    
    // Construct NUI URL
    const nuiUrl = `https://cfx-nui-${resourceName}/${logoPath}`
    // console.log('[ServerLogo] Constructed URL:', nuiUrl)
    return nuiUrl
  }

  const logoUrl = getLogoUrl()

  // Calculate X position
  const xPosition = savedPosition.x === 'center' 
    ? window.innerWidth / 2 - 150 // Center with offset for logo width
    : typeof savedPosition.x === 'number' 
      ? savedPosition.x 
      : parseInt(savedPosition.x as string)

  // Drag handlers
  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode) return
    
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
          serverLogo: {
            x: finalX,
            y: finalY,
            width: 300,
            height: 100
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

  // Resize handle handlers
  const handleResizeStart: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode) return
    
    e.stopPropagation() // Prevent dragging when resizing
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setIsResizing(true)
    
    resizeStartRef.current = {
      scale: savedScale,
      mouseX: e.clientX,
      mouseY: e.clientY
    }
    
    e.preventDefault()
  }

  const handleResizeMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isResizing || !resizeStartRef.current || !hudSettings) return
    
    // Calculate distance moved (use diagonal distance for more intuitive scaling)
    const deltaX = e.clientX - resizeStartRef.current.mouseX
    const deltaY = e.clientY - resizeStartRef.current.mouseY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const direction = (deltaX + deltaY) > 0 ? 1 : -1
    
    // Scale factor: 1px movement = 0.5% scale change
    const scaleChange = (distance * direction) * 0.5
    let newScale = resizeStartRef.current.scale + scaleChange
    
    // Clamp between 50 and 200
    newScale = Math.max(50, Math.min(200, newScale))
    
    // Update settings immediately (React state only - no server call)
    const updatedSettings = {
      ...hudSettings,
      serverLogoScale: Math.round(newScale)
    }
    
    // Update parent state via callback (local only)
    if ((window as any).updateHudSettings) {
      (window as any).updateHudSettings(updatedSettings)
    }
  }

  const handleResizeEnd: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isResizing) return
    
    const target = e.currentTarget
    target.releasePointerCapture(e.pointerId)
    setIsResizing(false)
    
    // Save to localStorage and Lua ONLY on drag end (not during movement)
    if (hudSettings) {
      const finalSettings = {
        ...hudSettings,
        serverLogoScale: hudSettings.serverLogoScale || config.scale
      }
      
      // Save to localStorage
      localStorage.setItem('hudSettings', JSON.stringify(finalSettings))
      
      // Save to Lua server ONCE after resize completes
      fetch(`https://${GetParentResourceName()}/saveHUDSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSettings)
      }).catch(() => {})
      
      // console.log('[ServerLogo] Scale saved:', finalSettings.serverLogoScale)
    }
    
    resizeStartRef.current = null
  }

  return (
    <div 
      ref={containerRef}
      className="server-logo-container"
      style={{
        position: 'absolute',
        left: `${xPosition}px`,
        top: `${savedPosition.y}px`,
        transform: `scale(${savedScale / 100})`,
        transformOrigin: 'top center',
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
      <img 
        src={logoUrl} 
        alt={config.serverName} 
        className="server-logo-image"
        onError={(e) => {
          // Hide if logo doesn't exist
          e.currentTarget.style.display = 'none'
        }}
        onLoad={() => {
          // Logo loaded successfully
        }}
      />
      
      {/* Resize Handle - Bottom Right Corner */}
      {positioningMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '20px',
            height: '20px',
            background: 'rgba(59, 130, 246, 0.9)',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 10001,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ pointerEvents: 'none' }}>
            <path d="M 10 2 L 2 10 M 10 6 L 6 10 M 10 10 L 10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default ServerLogo
