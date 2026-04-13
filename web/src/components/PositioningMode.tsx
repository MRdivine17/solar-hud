import { useState, useEffect } from 'react'
import { UIPositions } from '../types'
import './PositioningMode.css'

interface PositioningModeProps {
  isActive: boolean
  currentPositions: UIPositions
  onSave: (positions: UIPositions) => void
  onCancel: () => void
}

const PositioningMode = ({ isActive, currentPositions, onSave: _onSave, onCancel: _onCancel }: PositioningModeProps) => {
  const [positions, setPositions] = useState<UIPositions>(currentPositions)
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true)
  const [showSafezone, setShowSafezone] = useState<boolean>(true)
  const [showAnchorZones, setShowAnchorZones] = useState<boolean>(false)
  const [showHiddenComponents, setShowHiddenComponents] = useState<boolean>(true)
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [resizingElement, setResizingElement] = useState<string | null>(null)

  const GRID_SIZE = 10
  const SAFEZONE_MARGIN = 40

  // Define draggable HUD elements - Empty (minimap removed)
  const hudElements: any[] = []

  const snap = (value: number): number => {
    if (!snapToGrid) return value
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    const element = document.getElementById(`pos-${elementId}`)
    if (!element) return

    const rect = element.getBoundingClientRect()
    setDraggingElement(elementId)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    e.stopPropagation()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingElement) return

    const currentPos = positions[draggingElement as keyof UIPositions]
    if (!currentPos) return

    const newX = snap(e.clientX - dragOffset.x)
    const newY = snap(e.clientY - dragOffset.y)

    // Get element limits
    const element = hudElements.find(el => el.id === draggingElement)
    const width = currentPos.width || element?.minWidth || 100
    const height = currentPos.height || element?.minHeight || 100

    // Constrain to screen bounds
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - width))
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - height))

    setPositions(prev => ({
      ...prev,
      [draggingElement]: {
        ...currentPos,
        x: constrainedX,
        y: constrainedY,
        width: width,
        height: height
      }
    }))
  }

  const handleMouseUp = () => {
    setDraggingElement(null)
    setResizingElement(null)
  }

  // Helper to get resource name for NUI callbacks
  const getParentResourceName = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'hud'
    }
    const match = window.location.hostname.match(/^([^.]+)\./)
    return match ? match[1] : 'hud'
  }

  useEffect(() => {
    if (draggingElement || resizingElement) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingElement, resizingElement, dragOffset])

  // ESC key handler - close positioning mode
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Save positions to localStorage
        const savedSettings = localStorage.getItem('hudSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          settings.uiPositions = { ...settings.uiPositions, ...positions }
          localStorage.setItem('hudSettings', JSON.stringify(settings))
        }

        // Close positioning mode
        fetch(`https://${getParentResourceName()}/closeEditMenu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(() => {})
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, positions])

  const handleUndo = () => {
    setPositions(currentPositions)
  }

  const handleRedo = () => {
    // Simple redo - could be enhanced with history stack
  }

  if (!isActive) return null

  return (
    <div className="positioning-mode-overlay">
      {/* Grid Background */}
      <div 
        className="positioning-grid"
        style={{
          backgroundImage: snapToGrid 
            ? `
              linear-gradient(rgba(100, 150, 200, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 150, 200, 0.1) 1px, transparent 1px),
              linear-gradient(rgba(100, 150, 200, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 150, 200, 0.2) 1px, transparent 1px)
            `
            : 'none',
          backgroundSize: snapToGrid 
            ? `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`
            : '0'
        }}
      />

      {/* Safezone Indicator */}
      {showSafezone && (
        <div 
          className="safezone-border"
          style={{
            position: 'absolute',
            top: SAFEZONE_MARGIN,
            left: SAFEZONE_MARGIN,
            right: SAFEZONE_MARGIN,
            bottom: SAFEZONE_MARGIN,
            border: '2px dashed rgba(100, 150, 200, 0.4)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* Anchor Zones */}
      {showAnchorZones && (
        <>
          <div className="anchor-zone anchor-top-left" />
          <div className="anchor-zone anchor-top-right" />
          <div className="anchor-zone anchor-bottom-left" />
          <div className="anchor-zone anchor-bottom-right" />
        </>
      )}

      {/* Control Panel */}
      <div className="edit-mode-panel">
        <div className="edit-mode-header">
          <h3>Edit Mode</h3>
          <p>Drag, hide or resize any HUD component. To move around, simply click and drag. To hide, click the eye icon. Resizing is as simple as clicking and dragging from the right hand corner.</p>
        </div>

        <div className="edit-mode-options">
          <label className="edit-option">
            <input 
              type="checkbox" 
              checked={snapToGrid} 
              onChange={(e) => setSnapToGrid(e.target.checked)} 
            />
            <span>Snap to grid</span>
          </label>
          <label className="edit-option">
            <input 
              type="checkbox" 
              checked={showSafezone} 
              onChange={(e) => setShowSafezone(e.target.checked)} 
            />
            <span>Show safezone</span>
          </label>
          <label className="edit-option">
            <input 
              type="checkbox" 
              checked={showAnchorZones} 
              onChange={(e) => setShowAnchorZones(e.target.checked)} 
            />
            <span>Show anchor zones</span>
          </label>
          <label className="edit-option">
            <input 
              type="checkbox" 
              checked={showHiddenComponents} 
              onChange={(e) => setShowHiddenComponents(e.target.checked)} 
            />
            <span>Show hidden components</span>
          </label>
        </div>

        <div className="edit-mode-actions">
          <button className="edit-btn edit-btn-undo" onClick={handleUndo}>
            <i className="bi bi-arrow-counterclockwise"></i> Undo
          </button>
          <button className="edit-btn edit-btn-redo" onClick={handleRedo}>
            <i className="bi bi-arrow-clockwise"></i> Redo
          </button>
        </div>

        <div className="edit-mode-finish">
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.2)', 
            border: '2px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            width: '100%'
          }}>
            <div style={{ 
              fontSize: '16px', 
              color: '#60a5fa', 
              fontWeight: 'bold',
              marginBottom: '6px'
            }}>
              Press ESC to save and exit
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              All changes are saved automatically
            </div>
          </div>
        </div>
      </div>

      {/* REAL HUD Elements - Draggable */}
      {hudElements.map(element => {
        const pos = positions[element.id as keyof UIPositions] || {
          x: element.defaultX,
          y: element.defaultY,
          width: element.minWidth,
          height: element.minHeight
        }

        const isDragging = draggingElement === element.id

        return (
          <div
            key={element.id}
            id={`pos-${element.id}`}
            className={`positioning-element ${isDragging ? 'dragging' : ''}`}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              width: pos.width,
              height: pos.height,
              opacity: 1,
              pointerEvents: 'all',
              cursor: isDragging ? 'grabbing' : 'grab',
              border: '3px dashed rgba(59, 130, 246, 0.9)',
              background: 'rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              boxShadow: isDragging ? '0 8px 32px rgba(59, 130, 246, 0.6)' : '0 4px 16px rgba(59, 130, 246, 0.4)',
              transform: isDragging ? 'scale(1.03)' : 'scale(1)',
              transition: isDragging ? 'none' : 'transform 0.2s, box-shadow 0.2s',
              zIndex: isDragging ? 1000 : 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '10px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
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
              {element.label}
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
        )
      })}
    </div>
  )
}

export default PositioningMode
