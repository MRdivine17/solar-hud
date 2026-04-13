import { useState } from 'react'
import { HUDSettings, NotificationSettings, ProgressBarSettings } from '../types'
import './NotificationProgressSettings.css'

interface NotificationProgressSettingsProps {
  isOpen: boolean
  settings: HUDSettings
  onSave: (settings: HUDSettings) => void
  onClose: () => void
}

const NotificationProgressSettings = ({ isOpen, settings, onSave, onClose }: NotificationProgressSettingsProps) => {
  const [activeTab, setActiveTab] = useState<'notification' | 'progressbar'>('notification')
  
  if (!isOpen) return null
  
  const notificationSettings: NotificationSettings = settings.notification || {
    position: 'bottom-left',
    style: 'style1',
    successColor: '#10b981',
    errorColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6',
    bgColor: '#141419',
    textColor: '#ffffff',
    timerColor: '#60a5fa',
    transparency: 85
  }

  const progressBarSettings: ProgressBarSettings = settings.progressBar || {
    position: 'bottom-center',
    style: 'style1',
    defaultColor: '#3b82f6',
    bgColor: '#000000',
    textColor: '#ffffff',
    timerColor: '#60a5fa',
    percentageColor: '#ffffff',
    iconColor: '#3b82f6',
    transparency: 65
  }

  const updateNotificationSetting = (field: keyof NotificationSettings, value: any) => {
    const newNotification = { ...notificationSettings, [field]: value }
    const newSettings = { ...settings, notification: newNotification }
    onSave(newSettings)
  }

  const updateProgressBarSetting = (field: keyof ProgressBarSettings, value: any) => {
    const newProgressBar = { ...progressBarSettings, [field]: value }
    const newSettings = { ...settings, progressBar: newProgressBar }
    onSave(newSettings)
  }

  const testNotification = () => {
    // Send test notification
    window.postMessage({
      action: 'showNotification',
      data: {
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test notification!',
        duration: 3000
      }
    }, '*')
  }

  const testProgressBar = () => {
    // Send test progress bar
    window.postMessage({
      action: 'showProgressBar',
      data: {
        label: 'Testing Progress Bar...',
        duration: 5000,
        icon: 'mdi-clock-time-four-outline'
      }
    }, '*')
  }

  return (
    <div className="notification-progress-settings-overlay">
      <div className="notification-progress-settings-container">
        <div className="notification-progress-settings-header">
          <h2>Notification & Progress Bar Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="notification-progress-tabs">
          <button 
            className={`tab-btn ${activeTab === 'notification' ? 'active' : ''}`}
            onClick={() => setActiveTab('notification')}
          >
            📢 Notifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'progressbar' ? 'active' : ''}`}
            onClick={() => setActiveTab('progressbar')}
          >
            ⏱️ Progress Bar
          </button>
        </div>

        <div className="notification-progress-content">
          {activeTab === 'notification' && (
            <div className="settings-section">
              <h3>Notification Settings</h3>
              
              <div className="setting-group">
                <label>Position</label>
                <select 
                  value={notificationSettings.position}
                  onChange={(e) => updateNotificationSetting('position', e.target.value)}
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="center-left">Center Left</option>
                  <option value="center-right">Center Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Success Color</label>
                <input 
                  type="color" 
                  value={notificationSettings.successColor}
                  onChange={(e) => updateNotificationSetting('successColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Error Color</label>
                <input 
                  type="color" 
                  value={notificationSettings.errorColor}
                  onChange={(e) => updateNotificationSetting('errorColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Info Color</label>
                <input 
                  type="color" 
                  value={notificationSettings.infoColor}
                  onChange={(e) => updateNotificationSetting('infoColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Text Color</label>
                <input 
                  type="color" 
                  value={notificationSettings.textColor}
                  onChange={(e) => updateNotificationSetting('textColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Background Color</label>
                <input 
                  type="color" 
                  value={notificationSettings.bgColor}
                  onChange={(e) => updateNotificationSetting('bgColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Card Transparency: {notificationSettings.transparency}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={notificationSettings.transparency}
                  onChange={(e) => updateNotificationSetting('transparency', parseInt(e.target.value))}
                  className="transparency-slider"
                />
              </div>

              <button className="test-btn" onClick={testNotification}>
                Test Notification
              </button>
            </div>
          )}

          {activeTab === 'progressbar' && (
            <div className="settings-section">
              <h3>Progress Bar Settings</h3>
              
              <div className="setting-group">
                <label>Position</label>
                <select 
                  value={progressBarSettings.position}
                  onChange={(e) => updateProgressBarSetting('position', e.target.value)}
                >
                  <option value="top-center">Top Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Bar Color</label>
                <input 
                  type="color" 
                  value={progressBarSettings.defaultColor}
                  onChange={(e) => updateProgressBarSetting('defaultColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Text Color</label>
                <input 
                  type="color" 
                  value={progressBarSettings.textColor}
                  onChange={(e) => updateProgressBarSetting('textColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Percentage Color</label>
                <input 
                  type="color" 
                  value={progressBarSettings.percentageColor}
                  onChange={(e) => updateProgressBarSetting('percentageColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Icon Color</label>
                <input 
                  type="color" 
                  value={progressBarSettings.iconColor}
                  onChange={(e) => updateProgressBarSetting('iconColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Background Color</label>
                <input 
                  type="color" 
                  value={progressBarSettings.bgColor}
                  onChange={(e) => updateProgressBarSetting('bgColor', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Card Transparency: {progressBarSettings.transparency}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={progressBarSettings.transparency}
                  onChange={(e) => updateProgressBarSetting('transparency', parseInt(e.target.value))}
                  className="transparency-slider"
                />
              </div>

              <button className="test-btn" onClick={testProgressBar}>
                Test Progress Bar
              </button>
            </div>
          )}
        </div>

        <div className="notification-progress-footer">
          <button className="save-btn" onClick={onClose}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationProgressSettings
