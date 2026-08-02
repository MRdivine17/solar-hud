import { useState, useEffect, useRef } from 'react'
import { UIPositions } from '../types'
import './PositioningMode.css'

interface MinimapAnchor {
  x: number
  y: number
  width: number
  height: number
}

interface PositioningModeProps {
  isActive: boolean
  minimapAnchor: MinimapAnchor | null
  currentPositions: UIPositions
  onSave: (positions: UIPositions) => void
  onCancel: () => void
}

const PositioningMode = ({ isActive, minimapAnchor, currentPositions, onSave, onCancel: _onCancel }: PositioningModeProps) => {
  // Compute default card pixel position from the Lua-provided anchor (0-1 screen fractions).
  // If no anchor yet, fall back to a rough estimate. Anchor is sent by Lua on edit-mode open.
  const computeDefaultPixels = () => {
    const W = window.innerWidth
    const H = window.innerHeight
    if (minimapAnchor) {
      return {
        x:      Math.round(minimapAnchor.x * W),
        y:      Math.round(minimapAnchor.y * H),
        width:  Math.round(minimapAnchor.width * W),
        height: Math.round(minimapAnchor.height * H)
      }
    }
    // Rough fallback if anchor hasn't arrived yet
    return { x: 0, y: Math.round(H * 0.82), width: Math.round(W * 0.15), height: Math.round(H * 0.19) }
  }

  // The client sends the rect the minimap is ACTUALLY rendered at right now
  // (custom position included), so it is authoritative - always prefer it.
  // Trusting localStorage here is what made the card sit away from the map.
  const getInitialMinimap = () => {
    if (minimapAnchor) {
      return computeDefaultPixels()
    }
    if (currentPositions?.minimap?.width && currentPositions.minimap.width > 0) {
      return currentPositions.minimap
    }
    return computeDefaultPixels()
  }

  const initialPositions: UIPositions = {
    ...currentPositions,
    minimap: getInitialMinimap()
  }

  const [positions, setPositions] = useState<UIPositions>(initialPositions)
  // Ref always holds the latest positions so mouseup/keydown handlers are never stale
  const positionsRef = useRef<UIPositions>(initialPositions)

  // Re-sync from parent whenever mode is opened so saved positions are always respected
  useEffect(() => {
    if (isActive) {
      const synced: UIPositions = { ...currentPositions, minimap: getInitialMinimap() }
      positionsRef.current = synced
      setPositions(synced)
    }
  }, [isActive])

  // When the rect arrives from Lua, snap the card onto it. This always wins:
  // it describes where the map is on screen at this moment.
  useEffect(() => {
    if (!minimapAnchor) return
    const W = window.innerWidth
    const H = window.innerHeight
    const anchored = {
      x:      Math.round(minimapAnchor.x * W),
      y:      Math.round(minimapAnchor.y * H),
      width:  Math.round(minimapAnchor.width * W),
      height: Math.round(minimapAnchor.height * H)
    }
    const updated = { ...positionsRef.current, minimap: anchored }
    positionsRef.current = updated
    setPositions(updated)
  }, [minimapAnchor])

  const [snapToGrid, setSnapToGrid] = useState<boolean>(true)
  const [showSafezone, setShowSafezone] = useState<boolean>(true)
  const [showAnchorZones, setShowAnchorZones] = useState<boolean>(false)
  const [showHiddenComponents, setShowHiddenComponents] = useState<boolean>(true)
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [resizingElement, setResizingElement] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null)

  const GRID_SIZE = 10
  const SAFEZONE_MARGIN = 40

  const defaults = computeDefaultPixels()

  // Define draggable HUD elements
  const hudElements = [
    {
      id: 'minimap',
      label: 'MINIMAP',
      defaultX: positions?.minimap?.x ?? defaults.x,
      defaultY: positions?.minimap?.y ?? defaults.y,
      minWidth:  positions?.minimap?.width  ?? defaults.width,
      minHeight: positions?.minimap?.height ?? defaults.height,
      icon: '🗺️'
    }
  ]

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

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string) => {
    const pos = positions[elementId as keyof UIPositions]
    const element = hudElements.find(el => el.id === elementId)
    if (!pos) return

    setResizingElement(elementId)
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: pos.width || element?.minWidth || defaults.width,
      height: pos.height || element?.minHeight || defaults.height
    })

    e.stopPropagation()
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    // ---- resize ----
    if (resizingElement && resizeStart) {
      const currentPos = positions[resizingElement as keyof UIPositions]
      if (!currentPos) return

      const rawW = resizeStart.width + (e.clientX - resizeStart.mouseX)
      const rawH = resizeStart.height + (e.clientY - resizeStart.mouseY)

      // Clamp to 0.25x - 3x of the stock minimap size (matches the client clamp)
      const newWidth = snap(Math.max(defaults.width * 0.25, Math.min(defaults.width * 3, rawW)))
      const newHeight = snap(Math.max(defaults.height * 0.25, Math.min(defaults.height * 3, rawH)))

      const updated = {
        ...positions,
        [resizingElement]: { ...currentPos, width: newWidth, height: newHeight }
      }
      positionsRef.current = updated
      setPositions(updated)
      return
    }

    // ---- drag ----
    if (!draggingElement) return

    const currentPos = positions[draggingElement as keyof UIPositions]
    if (!currentPos) return

    const newX = snap(e.clientX - dragOffset.x)
    const newY = snap(e.clientY - dragOffset.y)

    // Get element limits
    const element = hudElements.find(el => el.id === draggingElement)
    const width = currentPos.width || element?.minWidth || 100
    const height = currentPos.height || element?.minHeight || 100

    // Constrain to screen bounds (allow slightly negative X to match GTA's minimap left-offset default)
    const constrainedX = Math.max(-width, Math.min(newX, window.innerWidth - width))
    const constrainedY = Math.max(-height, Math.min(newY, window.innerHeight - height))

    const updated = {
      ...positions,
      [draggingElement]: {
        ...currentPos,
        x: constrainedX,
        y: constrainedY,
        width: width,
        height: height
      }
    }
    positionsRef.current = updated
    setPositions(updated)
  }

  const handleMouseUp = () => {
    // Use ref so we always read the latest position (state is stale in closures)
    const touchedMinimap = draggingElement === 'minimap' || resizingElement === 'minimap'
    if (touchedMinimap && positionsRef.current.minimap) {
      sendMinimapPosition(positionsRef.current.minimap)
    }
    setDraggingElement(null)
    setResizingElement(null)
    setResizeStart(null)
  }

  // Helper to get resource name for NUI callbacks
  const getParentResourceName = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'solar-hud'
    }
    return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
  }

  // Send minimap position to client immediately.
  // Values go over as 0.0-1.0 fractions of the NUI viewport: the game converts
  // them with its own resolution, so a NUI/game resolution mismatch can no
  // longer scale the offset. Pixels are still sent for older client builds.
  const sendMinimapPosition = (pos: { x: number; y: number; width?: number; height?: number }) => {
    const d = computeDefaultPixels()
    const W = window.innerWidth
    const H = window.innerHeight
    const width = pos.width || d.width
    const height = pos.height || d.height

    const payload = {
      // legacy pixel fields
      x: pos.x,
      y: pos.y,
      width,
      height,
      // viewport the pixels were measured against
      screenWidth: W,
      screenHeight: H,
      // preferred, resolution-independent
      fracX: pos.x / W,
      fracY: pos.y / H,
      fracW: width / W,
      fracH: height / H
    }

    console.log('[HUD UI] Sending minimap position to client:', payload)
    fetch(`https://${getParentResourceName()}/updateMinimapPosition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.text())
      .then(t => console.log('[HUD UI] updateMinimapPosition response:', t))
      .catch(err => console.error('[HUD UI] updateMinimapPosition failed:', err))
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
  }, [draggingElement, resizingElement, dragOffset, resizeStart, positions])

  // ESC key handler - close positioning mode
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const latest = positionsRef.current
        // Send minimap position to client/server for immediate in-game update
        if (latest.minimap) {
          sendMinimapPosition(latest.minimap)
        }
        // PositioningMode only owns the minimap. All card/icon positions are
        // saved directly to localStorage by PlayerInfoCard / StatusBarCard.
        // We must NOT spread positionsRef here — it contains stale old positions
        // captured at mount and would overwrite the fresh card positions.
        const saved = localStorage.getItem('hudSettings')
        const savedSettings = saved ? JSON.parse(saved) : null
        const mergedPositions: UIPositions = {
          ...(savedSettings?.uiPositions || {}),
          minimap: latest.minimap
        } as UIPositions
        onSave(mergedPositions)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onSave])

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
          <div className="edit-mode-hint">
            <strong>Press ESC to save &amp; exit</strong>
            <span>All changes are saved automatically</span>
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
              pointerEvents: 'all',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: isDragging ? 1000 : 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '8px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id)}
          >
            <div className="pm-target-glyph">🗺</div>
            <div className="pm-target-label">{element.label}</div>
            <div className="pm-target-hint">Drag to move &bull; corner handle to resize</div>
            <div className="element-size pm-target-size">
              {Math.round(pos.width || 0)} &times; {Math.round(pos.height || 0)}
            </div>

            {/* Resize handle - bottom right */}
            <div
              className="positioning-resize-handle"
              onMouseDown={(e) => handleResizeMouseDown(e, element.id)}
            />
          </div>
        )
      })}
    </div>
  )
}

export default PositioningMode
