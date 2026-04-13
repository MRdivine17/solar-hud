import { useState, useEffect } from 'react'
import './ProgressBar.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface ProgressBarProps {
  isVisible: boolean
  label: string
  duration: number // in milliseconds
  icon?: string // Material Design Icon class
  position?: 'bottom-center' | 'top-center' | 'bottom-left' | 'bottom-right'
  textColor?: string
  percentageColor?: string
  iconColor?: string
  barColor?: string
  bgColor?: string
  transparency?: number
  onComplete?: () => void
}

const ProgressBar = ({ 
  isVisible, 
  label, 
  duration, 
  icon = 'mdi-clock-time-four-outline', 
  position = 'bottom-center',
  textColor = '#ffffff',
  percentageColor = '#ffffff',
  iconColor = '#3b82f6',
  barColor = '#3b82f6',
  bgColor = '#000000',
  transparency = 65,
  onComplete 
}: ProgressBarProps) => {
  
  // Helper to convert hex + transparency to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
  }
  const [progress, setProgress] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  useEffect(() => {
    if (isVisible) {
      setProgress(0)
      setStartTime(Date.now())
    } else {
      setStartTime(null)
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible || startTime === null) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)
      
      setProgress(newProgress)

      if (newProgress >= 100) {
        clearInterval(interval)
        if (onComplete) {
          onComplete()
        }
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [isVisible, startTime, duration, onComplete])

  const getPositionClass = () => {
    switch (position) {
      case 'top-center': return 'progress-bar-position-top-center'
      case 'bottom-left': return 'progress-bar-position-bottom-left'
      case 'bottom-right': return 'progress-bar-position-bottom-right'
      case 'bottom-center':
      default: return 'progress-bar-position-bottom-center'
    }
  }

  if (!isVisible) return null

  return (
    <div className={`progress-bar-overlay ${getPositionClass()}`}>
      <div className="progress-bar-container-main">
        {/* Icon Box */}
        <div 
          className="progress-bar-icon-box"
          style={{
            background: `linear-gradient(145deg, ${iconColor}, ${iconColor}dd)`
          }}
        >
          <i className={`mdi ${icon} progress-bar-icon`}></i>
        </div>

        {/* Content */}
        <div className="progress-bar-content">
          <div className="progress-bar-header">
            <span className="progress-bar-label" style={{ color: textColor }}>{label}</span>
          </div>
          
          {/* Progress Bar Track */}
          <div 
            className="progress-bar-track"
            style={{ background: hexToRgba(bgColor, transparency) }}
          >
            <div 
              className="progress-bar-fill-animated"
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`
              }}
            ></div>
          </div>
        </div>

        {/* Percentage - Positioned outside */}
        <span className="progress-bar-percentage" style={{ color: percentageColor }}>{Math.floor(progress)}%</span>
      </div>
    </div>
  )
}

export default ProgressBar
