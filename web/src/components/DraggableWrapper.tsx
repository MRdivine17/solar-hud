import { useState, useRef, useEffect, ReactNode } from 'react'
import './DraggableWrapper.css'

interface DraggableWrapperProps {
  id: string
  children: ReactNode
  initialPosition?: { x: number; y: number; width?: number; height?: number }
  isEditMode: boolean
  onPositionChange: (id: string, position: { x: number; y: number; width?: number; height?: number }) => void
  label?: string
  resizable?: boolean
}

const DraggableWrapper = ({
  id,
  children,
  initialPosition = { x: 0, y: 0 },
  isEditMode,
  onPositionChange,
  label,
  resizable = true
}: DraggableWrapperProps) => {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode || isResizing) return
    
    // Don't drag if clicking on resize handle
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!isEditMode || !resizable) return
    
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: position.width || elementRef.current?.offsetWidth || 100,
      height: position.height || elementRef.current?.offsetHeight || 100
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isEditMode) return

    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Constrain to viewport
      const maxX = window.innerWidth - (position.width || elementRef.current?.offsetWidth || 0)
      const maxY = window.innerHeight - (position.height || elementRef.current?.offsetHeight || 0)

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(0, Math.min(newY, maxY))

      setPosition({ ...position, x: constrainedX, y: constrainedY })
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = position.x
      let newY = position.y

      // Handle different resize directions
      if (resizeHandle.includes('e')) newWidth = Math.max(50, resizeStart.width + deltaX)
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newX = position.x + (resizeStart.width - newWidth)
      }
      if (resizeHandle.includes('s')) newHeight = Math.max(50, resizeStart.height + deltaY)
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = position.y + (resizeStart.height - newHeight)
      }

      setPosition({ x: newX, y: newY, width: newWidth, height: newHeight })
    }
  }

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      setIsDragging(false)
      setIsResizing(false)
      onPositionChange(id, position)
    }
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragStart, resizeStart, position])

  return (
    <div
      ref={elementRef}
      className={`draggable-wrapper ${isEditMode ? 'edit-mode' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        position: isEditMode ? 'fixed' : 'relative',
        left: isEditMode ? `${position.x}px` : 'auto',
        top: isEditMode ? `${position.y}px` : 'auto',
        width: position.width ? `${position.width}px` : 'auto',
        height: position.height ? `${position.height}px` : 'auto',
        zIndex: (isDragging || isResizing) ? 10000 : 'auto',
        cursor: isEditMode ? 'move' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditMode && label && (
        <div className="draggable-label">
          <i className="fas fa-arrows-alt"></i>
          {label}
          {position.width && position.height && (
            <span style={{ marginLeft: '8px', fontSize: '11px', opacity: 0.7 }}>
              {Math.round(position.width)}x{Math.round(position.height)}
            </span>
          )}
        </div>
      )}
      <div className={`draggable-content ${isEditMode ? 'with-border' : ''}`}>
        {children}
      </div>
      
      {/* Resize Handles */}
      {isEditMode && resizable && (
        <>
          <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
          <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
        </>
      )}
    </div>
  )
}

export default DraggableWrapper
