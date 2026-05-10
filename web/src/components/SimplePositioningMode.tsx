import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShield, faUtensils, faDroplet, faLungs, faBrain, faHashtag, faClock, faBriefcase, faUniversity, faMoneyBill, faSuitcase } from '@fortawesome/free-solid-svg-icons'
import { HUDSettings, HUDData, PlayerInfo as PlayerInfoType, MoneyData, WeaponData } from '../types'
import WeaponDisplay from './WeaponDisplay'
import './SimplePositioningMode.css'

// Helper to get resource name for NUI callbacks
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'hud' // Development fallback
  }
  const match = window.location.hostname.match(/^([^.]+)\./)
  return match ? match[1] : 'hud'
}

interface SimplePositioningModeProps {
  isActive: boolean
  settings: HUDSettings
  hudData: HUDData
  playerInfo: PlayerInfoType
  money: MoneyData
  weapon: WeaponData
  onSave: (settings: HUDSettings) => void
  onClose: () => void
}

const SimplePositioningMode = ({
  isActive,
  settings,
  hudData,
  playerInfo,
  money,
  weapon,
  onSave,
  onClose
}: SimplePositioningModeProps) => {
  // Generate responsive default positions based on current viewport
  const vh = window.innerHeight
  const vw = window.innerWidth
  
  const defaultPositions = settings.uiPositions || {
    minimap: { x: 20, y: vh - 280, width: 270, height: 200 },
    location: { x: 20, y: vh - 520, width: 270, height: 60 },
    weaponDisplay: { x: vw - 250, y: vh - 350, width: 350, height: 60 },
    statusBars: { x: 20, y: 150, width: 400, height: 60 },
    vehicleHud: { x: vw - 240, y: vh - 300, width: 180, height: 180 },
    playerInfoContainer: { x: 20, y: 20, width: 250, height: 240 },
    healthIcon: { x: 30, y: vh - 310, width: 56, height: 56 },
    armorIcon: { x: 90, y: vh - 310, width: 56, height: 56 },
    hungerIcon: { x: 150, y: vh - 310, width: 56, height: 56 },
    thirstIcon: { x: 210, y: vh - 310, width: 56, height: 56 },
    oxygenIcon: { x: 270, y: vh - 310, width: 56, height: 56 },
    stressIcon: { x: 330, y: vh - 310, width: 56, height: 56 },
    playerInfoId: { x: 20, y: 20, width: 200, height: 50 },
    playerInfoTime: { x: 20, y: 80, width: 200, height: 50 },
    playerInfoJob: { x: 20, y: 140, width: 200, height: 50 },
    playerInfoBank: { x: 20, y: 200, width: 200, height: 50 },
    playerInfoCash: { x: 20, y: 260, width: 200, height: 50 },
    playerInfoDirty: { x: 20, y: 320, width: 200, height: 50 }
  }
  
  const [positions, setPositions] = useState(defaultPositions)
  const [snapToGrid, setSnapToGrid] = useState(true)

  useEffect(() => {
    if (isActive) {
      setPositions(settings.uiPositions || defaultPositions)
    }
  }, [isActive])

  const [draggingKey, setDraggingKey] = useState<string | null>(null)
  const dragInfoRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const GRID_SIZE = 10

  useEffect(() => {
    if (!draggingKey || !dragInfoRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate new position based on mouse position minus the offset where user clicked
      const newX = e.clientX - dragInfoRef.current!.offsetX
      const newY = e.clientY - dragInfoRef.current!.offsetY
      
      // Apply grid snapping if enabled
      const snappedX = snapToGrid ? Math.round(newX / GRID_SIZE) * GRID_SIZE : newX
      const snappedY = snapToGrid ? Math.round(newY / GRID_SIZE) * GRID_SIZE : newY
      
      // Update positions locally
      setPositions(prev => ({
        ...prev,
        [draggingKey]: {
          ...prev[draggingKey as keyof typeof prev],
          x: Math.max(0, snappedX),
          y: Math.max(0, snappedY)
        }
      }))
    }

    const handleMouseUp = () => {
      // Send minimap position to Lua if minimap was dragged
      if (draggingKey === 'minimap' && positions.minimap) {
        fetch(`https://${GetParentResourceName()}/updateMinimapPosition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            x: positions.minimap.x,
            y: positions.minimap.y,
            width: positions.minimap.width || 270,
            height: positions.minimap.height || 200
          })
        }).catch(() => {}) // Ignore errors in development
      }
      
      // Save to real HUD when mouse is released
      onSave({ ...settings, uiPositions: positions })
      setDraggingKey(null)
      dragInfoRef.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingKey, snapToGrid, settings, positions, onSave])

  const handleSave = () => {
    // Send minimap position to Lua client
    if (positions.minimap) {
      fetch(`https://${GetParentResourceName()}/updateMinimapPosition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: positions.minimap.x,
          y: positions.minimap.y,
          width: positions.minimap.width || 270,
          height: positions.minimap.height || 200
        })
      })
    }
    
    // Save all positions to settings
    onSave({ ...settings, uiPositions: positions })
    onClose()
  }

  // ESC key handler - save and close (same as clicking "Save Positions")
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave() // Save positions before closing
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, positions, settings, onSave, onClose])

  const handleMouseDown = (e: React.MouseEvent, key: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    dragInfoRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    }
    setDraggingKey(key)
    e.preventDefault()
  }

  const formatMoney = (amount: number) => amount.toLocaleString('en-US')

  const renderCard = (posKey: string, label: string, icon: any, value: string) => {
    const pos = positions[posKey as keyof typeof positions] || { x: 20, y: 20 }
    const isDragging = draggingKey === posKey
    
    return (
      <div
        key={posKey}
        onMouseDown={(e) => handleMouseDown(e, posKey)}
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          pointerEvents: 'all',
          cursor: 'move',
          border: '2px dashed rgba(251, 146, 60, 0.8)',
          background: 'rgba(10, 10, 10, 0.9)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '200px',
          boxShadow: isDragging ? '0 8px 24px rgba(251, 146, 60, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
          zIndex: isDragging ? 10000 : 9000
        }}
      >
        <div style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(251, 146, 60, 0.2)',
          borderRadius: '8px'
        }}>
          <FontAwesomeIcon icon={icon} style={{ color: '#fb923c', fontSize: '20px' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>{label}</div>
          <div style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>{value}</div>
        </div>
      </div>
    )
  }

  const renderStatusIcon = (posKey: string, label: string, icon: any, value: number, color: string) => {
    const pos = positions[posKey as keyof typeof positions] || { x: 30, y: vh - 310 }
    const isDragging = draggingKey === posKey
    
    return (
      <div
        key={posKey}
        onMouseDown={(e) => handleMouseDown(e, posKey)}
        style={{
          position: 'absolute',
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          pointerEvents: 'all',
          cursor: 'move',
          border: '2px dashed rgba(251, 146, 60, 0.8)',
          background: 'rgba(10, 10, 10, 0.9)',
          borderRadius: '12px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          minWidth: '70px',
          boxShadow: isDragging ? '0 8px 24px rgba(251, 146, 60, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
          zIndex: isDragging ? 10000 : 9000
        }}
      >
        <div style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}20`,
          borderRadius: '50%',
          border: `2px solid ${color}`
        }}>
          <FontAwesomeIcon icon={icon} style={{ color: color, fontSize: '24px' }} />
        </div>
        <div style={{ fontSize: '9px', color: '#999', textAlign: 'center' }}>{label}</div>
        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold' }}>{value}%</div>
      </div>
    )
  }

  if (!isActive) return null

  return (
    <div className="simple-positioning-overlay">
      <div className="simple-positioning-grid" style={{
        backgroundImage: snapToGrid ? `
          linear-gradient(rgba(100, 150, 200, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100, 150, 200, 0.1) 1px, transparent 1px)
        ` : 'none',
        backgroundSize: snapToGrid ? `${GRID_SIZE}px ${GRID_SIZE}px` : '0'
      }} />
      
      <div className="simple-positioning-instructions">
        <h3>🎯 Position HUD Elements</h3>
        <p>Drag individual cards to reposition them</p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
          <span>Snap to Grid ({GRID_SIZE}px)</span>
        </label>
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.15)', 
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '8px',
          padding: '12px',
          marginTop: '16px',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '14px', 
            color: '#60a5fa', 
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            Press ESC to save and exit
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            All changes are saved automatically
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }}>
        {/* Minimap Placeholder - ALWAYS VISIBLE */}
        <div
          onMouseDown={(e) => handleMouseDown(e, 'minimap')}
          style={{
            position: 'absolute',
            left: `${positions.minimap?.x || 20}px`,
            top: `${positions.minimap?.y || 600}px`,
            width: `${positions.minimap?.width || 270}px`,
            height: `${positions.minimap?.height || 200}px`,
            pointerEvents: 'all',
            cursor: 'move',
            border: '3px dashed rgba(59, 130, 246, 0.9)',
            background: 'rgba(59, 130, 246, 0.25)',
            borderRadius: '12px',
            boxShadow: draggingKey === 'minimap' ? '0 8px 32px rgba(59, 130, 246, 0.6)' : '0 4px 16px rgba(59, 130, 246, 0.4)',
            transform: draggingKey === 'minimap' ? 'scale(1.03)' : 'scale(1)',
            transition: draggingKey === 'minimap' ? 'none' : 'transform 0.2s, box-shadow 0.2s',
            zIndex: draggingKey === 'minimap' ? 10001 : 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{
            fontSize: '48px',
            lineHeight: '1',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)'
          }}>
            🗺️
          </div>
          <div style={{
            fontSize: '16px',
            color: '#fff',
            fontWeight: 'bold',
            textShadow: '0 2px 6px rgba(0,0,0,0.9)',
            textAlign: 'center',
            letterSpacing: '1px'
          }}>
            MINIMAP
          </div>
          <div style={{
            fontSize: '11px',
            color: '#e0e0e0',
            textAlign: 'center',
            padding: '0 16px',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)'
          }}>
            Drag to reposition in-game minimap
          </div>
        </div>

        {/* Player Info Cards - Only show if enabled in settings */}
        {settings.playerInfo?.showId !== false && renderCard('playerInfoId', 'ID', faHashtag, `${playerInfo.serverId}`)}
        {settings.playerInfo?.showTime !== false && renderCard('playerInfoTime', 'Server Time', faClock, '12:00')}
        {settings.playerInfo?.showJob !== false && renderCard('playerInfoJob', 'Job', faBriefcase, playerInfo.job)}
        {settings.playerInfo?.showBank !== false && renderCard('playerInfoBank', 'Bank', faUniversity, `$${formatMoney(money.bank)}`)}
        {settings.playerInfo?.showCash !== false && renderCard('playerInfoCash', 'Cash', faMoneyBill, `$${formatMoney(money.cash)}`)}
        {settings.playerInfo?.showDirty !== false && renderCard('playerInfoDirty', 'Dirty Money', faSuitcase, `$${formatMoney(money.dirty)}`)}

        {/* Status Icons - Only show if enabled in settings */}
        {settings.health?.visible !== false && renderStatusIcon('healthIcon', 'Health', faHeart, hudData.health, settings.health?.progressColor || '#ef4444')}
        {settings.armor?.visible !== false && renderStatusIcon('armorIcon', 'Armor', faShield, hudData.armor, settings.armor?.progressColor || '#14b8a6')}
        {settings.hunger?.visible !== false && renderStatusIcon('hungerIcon', 'Hunger', faUtensils, hudData.hunger, settings.hunger?.progressColor || '#f59e0b')}
        {settings.thirst?.visible !== false && renderStatusIcon('thirstIcon', 'Thirst', faDroplet, hudData.thirst, settings.thirst?.progressColor || '#60a5fa')}
        {settings.oxygen?.visible !== false && renderStatusIcon('oxygenIcon', 'Oxygen', faLungs, hudData.oxygen, settings.oxygen?.progressColor || '#00bcd4')}
        {settings.stress?.visible !== false && renderStatusIcon('stressIcon', 'Stress', faBrain, hudData.stress, settings.stress?.progressColor || '#9c27b0')}

        {/* Weapon Display - Only show if player has weapon */}
        {weapon.hasWeapon && (() => {
          const pos = positions.weaponDisplay || { x: vw - 250, y: vh - 350 }
          const isDragging = draggingKey === 'weaponDisplay'
          
          return (
            <div
              key="weaponDisplay"
              onMouseDown={(e) => handleMouseDown(e, 'weaponDisplay')}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                pointerEvents: 'all',
                cursor: 'move',
                border: '2px dashed rgba(251, 146, 60, 0.8)',
                padding: '4px',
                background: 'rgba(251, 146, 60, 0.1)',
                borderRadius: '8px',
                boxShadow: isDragging ? '0 8px 24px rgba(251, 146, 60, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
                zIndex: isDragging ? 10000 : 9000
              }}
            >
              <div style={{ fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.9)', padding: '2px 6px', borderRadius: '4px', marginBottom: '4px', fontWeight: 'bold' }}>
                Weapon: {weapon.weaponLabel || weapon.weaponName}
              </div>
              <WeaponDisplay weapon={weapon} settings={settings.playerInfo} />
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default SimplePositioningMode
