import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import './Notification.css'

export type NotificationType = 'success' | 'error' | 'info'

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  duration: number
}

class NotificationManager {
  private static instance: NotificationManager
  private listeners: Set<(notifications: NotificationItem[]) => void> = new Set()
  private notifications: NotificationItem[] = []
  private nextId = 0

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  subscribe(listener: (notifications: NotificationItem[]) => void): (() => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(listeners: Set<(notifications: NotificationItem[]) => void>) {
    listeners.forEach(listener => listener([...this.notifications]))
  }

  show(type: NotificationType, title: string, message: string, duration: number = 3000) {
    const id = `notification-${this.nextId++}`
    const notification: NotificationItem = { id, type, title, message, duration }

    this.notifications.push(notification)
    this.notify(this.listeners)

    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== id)
      this.notify(this.listeners)
    }, duration)

    return id
  }

  success(title: string, message: string, duration?: number) {
    return this.show('success', title, message, duration)
  }

  error(title: string, message: string, duration?: number) {
    return this.show('error', title, message, duration)
  }

  info(title: string, message: string, duration?: number) {
    return this.show('info', title, message, duration)
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.notify(this.listeners)
  }

  clear() {
    this.notifications = []
    this.notify(this.listeners)
  }
}

export const notificationManager = NotificationManager.getInstance()

const NotificationItem = ({ 
  notification, 
  onClose, 
  successColor, 
  errorColor, 
  infoColor, 
  textColor, 
  bgColor, 
  transparency,
  hexToRgba 
}: { 
  notification: NotificationItem
  onClose: () => void
  successColor: string
  errorColor: string
  infoColor: string
  textColor: string
  bgColor: string
  transparency: number
  hexToRgba: (hex: string, alpha: number) => string
}) => {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 200)
    }, notification.duration)

    return () => clearTimeout(timer)
  }, [notification.duration, onClose])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return faCheckCircle
      case 'error':
        return faExclamationCircle
      case 'info':
        return faInfoCircle
      default:
        return faInfoCircle
    }
  }

  // Get colors from parent
  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return { iconBg: successColor, titleColor: successColor }
      case 'error':
        return { iconBg: errorColor, titleColor: errorColor }
      case 'info':
        return { iconBg: infoColor, titleColor: infoColor }
      default:
        return { iconBg: infoColor, titleColor: infoColor }
    }
  }

  const colors = getColors()

  return (
    <div 
      className={`notification-item notification-${notification.type} ${isExiting ? 'exiting' : ''}`}
      style={{ background: hexToRgba(bgColor, transparency) }}
    >
      <div className="notification-icon" style={{ background: colors.iconBg }}>
        <FontAwesomeIcon icon={getIcon()} />
      </div>
      <div className="notification-content">
        <span className="notification-title" style={{ color: colors.titleColor }}>{notification.title}</span>
        <span className="notification-message" style={{ color: textColor }}>{notification.message}</span>
      </div>
    </div>
  )
}

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center-left' | 'center-right'
  successColor?: string
  errorColor?: string
  infoColor?: string
  textColor?: string
  bgColor?: string
  transparency?: number
}

const NotificationContainer = ({ 
  position = 'bottom-left',
  successColor = '#10b981',
  errorColor = '#ef4444',
  infoColor = '#3b82f6',
  textColor = '#ffffff',
  bgColor = '#141419',
  transparency = 85
}: NotificationContainerProps) => {
  
  // Helper to convert hex + transparency to rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications)
    return () => unsubscribe()
  }, [])

  // Handle NUI messages from Lua - Synced
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return
      
      const { action, data } = event.data

      if (action === 'showNotification' && data) {
        // Validate and extract notification data
        const type = data.type || 'info'
        const title = data.title || 'Notification'
        const message = data.message || ''
        const duration = Math.max(1000, data.duration || 3000)
        
        // Validate type
        const validTypes = ['success', 'error', 'info']
        const notificationType = validTypes.includes(type) ? type : 'info'
        
        // Show notification
        notificationManager.show(notificationType as NotificationType, title, message, duration)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Get position class
  const getPositionClass = () => {
    switch (position) {
      case 'top-left': return 'notification-position-top-left'
      case 'top-right': return 'notification-position-top-right'
      case 'top-center': return 'notification-position-top-center'
      case 'bottom-right': return 'notification-position-bottom-right'
      case 'bottom-center': return 'notification-position-bottom-center'
      case 'center-left': return 'notification-position-center-left'
      case 'center-right': return 'notification-position-center-right'
      case 'bottom-left':
      default: return 'notification-position-bottom-left'
    }
  }

  return (
    <div className={`notification-container ${getPositionClass()}`}>
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => notificationManager.remove(notification.id)}
          successColor={successColor}
          errorColor={errorColor}
          infoColor={infoColor}
          textColor={textColor}
          bgColor={bgColor}
          transparency={transparency}
          hexToRgba={hexToRgba}
        />
      ))}
    </div>
  )
}

export default NotificationContainer
