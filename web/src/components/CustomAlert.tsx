import { useEffect } from 'react'
import './CustomAlert.css'

interface CustomAlertProps {
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  onClose: () => void
  onConfirm?: () => void
  onCancel?: () => void
}

const CustomAlert = ({ type, title, message, onClose, onConfirm, onCancel }: CustomAlertProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      case 'confirm':
        return '?'
      default:
        return 'ℹ'
    }
  }

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#22c55e'
      case 'error':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'info':
        return '#3b82f6'
      case 'confirm':
        return '#6496c8'
      default:
        return '#3b82f6'
    }
  }

  return (
    <div className="custom-alert-overlay" onClick={onClose}>
      <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className="custom-alert-icon" style={{ background: getColor() }}>
          {getIcon()}
        </div>
        <div className="custom-alert-content">
          <h3 className="custom-alert-title">{title}</h3>
          <p className="custom-alert-message">{message}</p>
        </div>
        <div className="custom-alert-actions">
          {type === 'confirm' ? (
            <>
              <button 
                className="custom-alert-btn custom-alert-btn-cancel" 
                onClick={() => {
                  onCancel?.()
                  onClose()
                }}
              >
                Cancel
              </button>
              <button 
                className="custom-alert-btn custom-alert-btn-confirm" 
                onClick={() => {
                  onConfirm?.()
                  onClose()
                }}
                style={{ background: getColor() }}
              >
                OK
              </button>
            </>
          ) : (
            <button 
              className="custom-alert-btn custom-alert-btn-ok" 
              onClick={onClose}
              style={{ background: getColor() }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomAlert
