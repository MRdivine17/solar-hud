import { useState, useRef, useEffect } from 'react'
import './ColorPicker.css'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  onClose: () => void
  position: { x: number; y: number }
  uniqueId: string // Add unique identifier to prevent state mixing
}

const ColorPicker = ({ color, onChange, onClose, position, uniqueId }: ColorPickerProps) => {
  const [hue, setHue] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [alpha, setAlpha] = useState(100)
  const [hexInput, setHexInput] = useState(color)
  
  const gradientRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Parse initial color - now depends on uniqueId to reset when picker changes
  useEffect(() => {
    const hex = color.replace('#', '')
    if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) : 255
      
      // Convert RGB to HSB
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const delta = max - min
      
      let h = 0
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6
        else if (max === g) h = (b - r) / delta + 2
        else h = (r - g) / delta + 4
        h = Math.round(h * 60)
        if (h < 0) h += 360
      }
      
      const s = max === 0 ? 0 : (delta / max) * 100
      const v = (max / 255) * 100
      
      setHue(h)
      setSaturation(s)
      setBrightness(v)
      setAlpha(Math.round((a / 255) * 100))
      setHexInput(color)
    }
  }, [color, uniqueId])

  // Convert HSB to RGB
  const hsbToRgb = (h: number, s: number, v: number) => {
    s = s / 100
    v = v / 100
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    
    let r = 0, g = 0, b = 0
    if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
    else { r = c; g = 0; b = x }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    }
  }

  // Update color
  const updateColor = (h: number, s: number, v: number, a: number) => {
    const rgb = hsbToRgb(h, s, v)
    const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}${Math.round((a / 100) * 255).toString(16).padStart(2, '0')}`
    setHexInput(hex)
    onChange(hex)
  }

  // Handle gradient click/drag
  const handleGradientInteraction = (e: React.MouseEvent | MouseEvent) => {
    if (!gradientRef.current) return
    const rect = gradientRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    
    const newSaturation = (x / rect.width) * 100
    const newBrightness = 100 - (y / rect.height) * 100
    
    setSaturation(newSaturation)
    setBrightness(newBrightness)
    updateColor(hue, newSaturation, newBrightness, alpha)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    handleGradientInteraction(e)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      handleGradientInteraction(e)
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [hue, alpha, saturation, brightness])

  const handleHueChange = (newHue: number) => {
    setHue(newHue)
    updateColor(newHue, saturation, brightness, alpha)
  }

  const handleAlphaChange = (newAlpha: number) => {
    setAlpha(newAlpha)
    updateColor(hue, saturation, brightness, newAlpha)
  }

  const handleHexInput = (value: string) => {
    setHexInput(value)
    if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value)) {
      onChange(value)
    }
  }

  const currentColor = hsbToRgb(hue, saturation, brightness)
  const currentHex = `#${currentColor.r.toString(16).padStart(2, '0')}${currentColor.g.toString(16).padStart(2, '0')}${currentColor.b.toString(16).padStart(2, '0')}${Math.round((alpha / 100) * 255).toString(16).padStart(2, '0')}`

  // Smart positioning to keep picker within viewport
  const getAdjustedPosition = () => {
    const pickerWidth = 280 // Width from CSS
    const pickerHeight = 420 // Approximate height
    const padding = 10 // Padding from edges
    
    let adjustedX = position.x
    let adjustedY = position.y
    
    // Check right edge
    if (adjustedX + pickerWidth > window.innerWidth - padding) {
      adjustedX = window.innerWidth - pickerWidth - padding
    }
    
    // Check left edge
    if (adjustedX < padding) {
      adjustedX = padding
    }
    
    // Check bottom edge
    if (adjustedY + pickerHeight > window.innerHeight - padding) {
      adjustedY = window.innerHeight - pickerHeight - padding
    }
    
    // Check top edge
    if (adjustedY < padding) {
      adjustedY = padding
    }
    
    return { x: adjustedX, y: adjustedY }
  }

  const adjustedPosition = getAdjustedPosition()

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div 
        ref={pickerRef}
        className="color-picker-popup" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`
        }}
      >
        {/* Header */}
        <div className="color-picker-header">
          <div className="color-preview-circle" style={{ background: currentHex }}></div>
          <span className="color-hex-display">{currentHex.toUpperCase()}</span>
        </div>

        {/* Gradient Selector */}
        <div 
          ref={gradientRef}
          className="color-gradient"
          style={{ background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))` }}
          onMouseDown={handleMouseDown}
        >
          <div 
            className="color-selector-circle"
            style={{
              left: `${saturation}%`,
              top: `${100 - brightness}%`
            }}
          ></div>
        </div>

        {/* Sliders */}
        <div className="color-sliders">
          {/* Hue Slider */}
          <div className="slider-row">
            <div className="slider-label">Hue</div>
            <div className="slider-track-wrapper">
              <div className="hue-slider-track"></div>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => handleHueChange(parseInt(e.target.value))}
                className="hue-slider"
              />
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="slider-row">
            <div className="slider-label">Opacity</div>
            <div className="slider-track-wrapper">
              <div className="opacity-slider-track" style={{ 
                background: `linear-gradient(to right, transparent, ${currentHex.substring(0, 7)})`
              }}></div>
              <input
                type="range"
                min="0"
                max="100"
                value={alpha}
                onChange={(e) => handleAlphaChange(parseInt(e.target.value))}
                className="opacity-slider"
              />
            </div>
            <span className="slider-value">{alpha}%</span>
          </div>
        </div>

        {/* Hex Input */}
        <div className="hex-input-row">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            className="hex-input-field"
            placeholder="#RRGGBBAA"
          />
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(currentHex)}>
            📋
          </button>
        </div>
      </div>
    </div>
  )
}

export default ColorPicker
