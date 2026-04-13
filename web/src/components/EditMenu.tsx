import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart, faShield, faBurger, faBottleWater, faLungs, faBrain, faGear, faPlus, faXmark, faCar, faShip, faPlane, faMap, faUser, faFileImport, faBell, faSpinner } from '@fortawesome/free-solid-svg-icons'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './EditMenu.css'
import { HUDSettings, StatusBarSettings } from '../types'
import ColorPicker from './ColorPicker'
import CustomAlert from './CustomAlert'
import { faSuitcase } from '@fortawesome/free-solid-svg-icons/faSuitcase'
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons/faMoneyBill'
import { faUniversity } from '@fortawesome/free-solid-svg-icons/faUniversity'
import { faBriefcase } from '@fortawesome/free-solid-svg-icons/faBriefcase'
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock'
import { faHashtag } from '@fortawesome/free-solid-svg-icons/faHashtag'

interface EditMenuProps {
  isOpen: boolean
  onClose: () => void
  settings: HUDSettings
  onSave: (settings: HUDSettings) => void
  onOpenPositioningMode: () => void
  onResetPositions: () => void
}

const EditMenu = ({ isOpen, onClose, settings, onSave, onOpenPositioningMode, onResetPositions }: EditMenuProps) => {
  const [currentSettings, setCurrentSettings] = useState<HUDSettings>(settings)
  const [activeColorPicker, setActiveColorPicker] = useState<{ key: keyof HUDSettings; field: string; position: { x: number; y: number }; uniqueId: string } | null>(null)
  const [activePlayerInfoColorPicker, setActivePlayerInfoColorPicker] = useState<{ colorPath: string; position: { x: number; y: number }; uniqueId: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'health' | 'vehicle' | 'boat' | 'flight' | 'minimap' | 'playerinfo' | 'notifications' | 'progressbar' | 'import'>('health')
  const [importJson, setImportJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
    onCancel?: () => void
  } | null>(null)

  const style = currentSettings.style || 'progressOutline'
  const borderRadius = currentSettings.borderRadius || 'fullyRounded'
  
  // Initialize playerInfo settings with defaults
  const defaultColors = {
    iconColor: '#ffffff',
    textColor: '#ffffff',
    labelColor: '#999999',
    bgColor: '#0a0a0a',
    iconBgColor: '#1a1a1a'
  }
  
  const basePlayerInfoSettings = currentSettings.playerInfo || {
    enabled: true,
    layoutStyle: 'miniature',
    cardStyle: 'rounded',
    themeMode: 'dark',
    bgColor: '#000000',
    iconBgColor: '#1a1a1a',
    contentBgColor: '#0a0a0a',
    transparency: 85,
    position: { x: 12, y: 12 },
    scale: 100,
    showId: true,
    showTime: true,
    showJob: true,
    showBank: true,
    showCash: true,
    showDirty: false,
    showVoice: true,
    showWeather: true,
    showServerInfo: true,
    serverName: 'Server Name',
    serverLogo: '',
    weatherIconType: 'fontawesome',
    weatherIconPath: '',
    showLogo: false,
    logoScale: 100,
    logoPosition: { x: 50, y: 10 },
    idColors: defaultColors,
    timeColors: defaultColors,
    jobColors: defaultColors,
    bankColors: defaultColors,
    cashColors: defaultColors,
    dirtyColors: defaultColors,
    voiceColors: { ...defaultColors, iconColor: '#00ff00', textColor: '#00ff00' }
  }
  
  // Ensure all color properties exist with fallbacks
  const playerInfoSettings = {
    ...basePlayerInfoSettings,
    position: basePlayerInfoSettings.position || { x: 12, y: 12 },
    showLogo: basePlayerInfoSettings.showLogo ?? false,
    logoScale: basePlayerInfoSettings.logoScale || 100,
    logoPosition: basePlayerInfoSettings.logoPosition || { x: 50, y: 10 },
    idColors: basePlayerInfoSettings.idColors || defaultColors,
    timeColors: basePlayerInfoSettings.timeColors || defaultColors,
    jobColors: basePlayerInfoSettings.jobColors || defaultColors,
    bankColors: basePlayerInfoSettings.bankColors || defaultColors,
    cashColors: basePlayerInfoSettings.cashColors || defaultColors,
    dirtyColors: basePlayerInfoSettings.dirtyColors || defaultColors,
    voiceColors: basePlayerInfoSettings.voiceColors || { ...defaultColors, iconColor: '#00ff00', textColor: '#00ff00' }
  }

  const updateStyle = (newStyle: 'progressOutline' | 'progressFill' | 'percentages' | 'progressBar') => {
    const newSettings = { ...currentSettings, style: newStyle }
    debouncedSave(newSettings)
  }

  // Universal debounce timer for ALL settings changes (prevents network overflow)
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null)
  const serverSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const DEBOUNCE_DELAY = 1000 // 2 seconds delay before saving to server

  // Debounced save function - updates UI immediately, saves to server after delay
  const debouncedSave = (newSettings: HUDSettings) => {
    // 1. Update local state immediately (for EditMenu preview)
    setCurrentSettings(newSettings)
    
    // 2. Update parent state immediately (for real-time game UI feedback)
    onSave(newSettings)
    
    // 3. Show saving indicator
    setIsSaving(true)
    
    // 4. Clear existing server save timer
    if (serverSaveTimer.current) {
      clearTimeout(serverSaveTimer.current)
    }
    
    // 5. Set new timer - save after user stops making changes for 2 seconds
    serverSaveTimer.current = setTimeout(() => {
      onSave(newSettings)
      console.log('[HUD] Settings saved to localStorage after 2 second delay')
      
      // Hide saving indicator after save
      setIsSaving(false)
      serverSaveTimer.current = null
    }, DEBOUNCE_DELAY)
  }

  const updatePlayerInfoSetting = (field: string, value: any) => {
    const newPlayerInfo = { ...playerInfoSettings, [field]: value }
    const newSettings = { ...currentSettings, playerInfo: newPlayerInfo }
    debouncedSave(newSettings)
  }

  const updateBorderRadius = (newRadius: 'fullyRounded' | 'slightlyRounded' | 'square') => {
    const newSettings = { ...currentSettings, borderRadius: newRadius }
    debouncedSave(newSettings)
  }

  // Generate HUD configuration JSON (includes ALL settings)
  const generateHUDConfig = () => {
    const resolution = `${window.innerWidth}x${window.innerHeight}`
    const positions: any = currentSettings.uiPositions || {}
    
    return {
      resolution,
      layout: {
        // Status bars
        healthIcon: {
          dimensions: { height: positions.healthIcon?.height || 56, width: positions.healthIcon?.width || 56 },
          offset: { x: positions.healthIcon?.x || 30, y: positions.healthIcon?.y || 770, bottom: 0, left: positions.healthIcon?.x || 30, offsetX: 0, offsetY: 0 }
        },
        armorIcon: {
          dimensions: { height: positions.armorIcon?.height || 56, width: positions.armorIcon?.width || 56 },
          offset: { x: positions.armorIcon?.x || 90, y: positions.armorIcon?.y || 770, bottom: 0, left: positions.armorIcon?.x || 90, offsetX: 0, offsetY: 0 }
        },
        hungerIcon: {
          dimensions: { height: positions.hungerIcon?.height || 56, width: positions.hungerIcon?.width || 56 },
          offset: { x: positions.hungerIcon?.x || 150, y: positions.hungerIcon?.y || 770, bottom: 0, left: positions.hungerIcon?.x || 150, offsetX: 0, offsetY: 0 }
        },
        thirstIcon: {
          dimensions: { height: positions.thirstIcon?.height || 56, width: positions.thirstIcon?.width || 56 },
          offset: { x: positions.thirstIcon?.x || 210, y: positions.thirstIcon?.y || 770, bottom: 0, left: positions.thirstIcon?.x || 210, offsetX: 0, offsetY: 0 }
        },
        oxygenIcon: {
          dimensions: { height: positions.oxygenIcon?.height || 56, width: positions.oxygenIcon?.width || 56 },
          offset: { x: positions.oxygenIcon?.x || 270, y: positions.oxygenIcon?.y || 770, bottom: 0, left: positions.oxygenIcon?.x || 270, offsetX: 0, offsetY: 0 }
        },
        stressIcon: {
          dimensions: { height: positions.stressIcon?.height || 56, width: positions.stressIcon?.width || 56 },
          offset: { x: positions.stressIcon?.x || 330, y: positions.stressIcon?.y || 770, bottom: 0, left: positions.stressIcon?.x || 330, offsetX: 0, offsetY: 0 }
        },
        // Other elements
        minimap: {
          dimensions: { height: positions.minimap?.height || 200, width: positions.minimap?.width || 270 },
          offset: { x: positions.minimap?.x || 20, y: positions.minimap?.y || 600, bottom: 68, left: 0, offsetX: 0, offsetY: 0 }
        },
        location: {
          dimensions: { height: positions.location?.height || 60, width: positions.location?.width || 270 },
          offset: { x: positions.location?.x || 20, y: positions.location?.y || 560, bottom: 300, left: 20, offsetX: 0, offsetY: 0 }
        },
        weaponDisplay: {
          dimensions: { height: positions.weaponDisplay?.height || 60, width: positions.weaponDisplay?.width || 350 },
          offset: { x: positions.weaponDisplay?.x || 1670, y: positions.weaponDisplay?.y || 730, right: 0, offsetX: 0, offsetY: 0 }
        },
        vehicleHud: {
          dimensions: { height: positions.vehicleHud?.height || 180, width: positions.vehicleHud?.width || 180 },
          offset: { x: positions.vehicleHud?.x || 1680, y: positions.vehicleHud?.y || 780, bottom: 60, right: 0, offsetX: 0, offsetY: 0 }
        },
        playerInfoContainer: {
          dimensions: { height: positions.playerInfoContainer?.height || 240, width: positions.playerInfoContainer?.width || 250 },
          offset: { x: positions.playerInfoContainer?.x || 20, y: positions.playerInfoContainer?.y || 20, top: 20, right: 0, offsetX: 0, offsetY: 0 }
        },
        // Individual player info cards (if enabled)
        ...(positions.playerInfoId && {
          playerInfoId: {
            dimensions: { height: positions.playerInfoId.height || 50, width: positions.playerInfoId.width || 200 },
            offset: { x: positions.playerInfoId.x, y: positions.playerInfoId.y, offsetX: 0, offsetY: 0 }
          }
        }),
        ...(positions.playerInfoTime && {
          playerInfoTime: {
            dimensions: { height: positions.playerInfoTime.height || 50, width: positions.playerInfoTime.width || 200 },
            offset: { x: positions.playerInfoTime.x, y: positions.playerInfoTime.y, offsetX: 0, offsetY: 0 }
          }
        }),
        ...(positions.playerInfoJob && {
          playerInfoJob: {
            dimensions: { height: positions.playerInfoJob.height || 50, width: positions.playerInfoJob.width || 200 },
            offset: { x: positions.playerInfoJob.x, y: positions.playerInfoJob.y, offsetX: 0, offsetY: 0 }
          }
        }),
        ...(positions.playerInfoBank && {
          playerInfoBank: {
            dimensions: { height: positions.playerInfoBank.height || 50, width: positions.playerInfoBank.width || 200 },
            offset: { x: positions.playerInfoBank.x, y: positions.playerInfoBank.y, offsetX: 0, offsetY: 0 }
          }
        }),
        ...(positions.playerInfoCash && {
          playerInfoCash: {
            dimensions: { height: positions.playerInfoCash.height || 50, width: positions.playerInfoCash.width || 200 },
            offset: { x: positions.playerInfoCash.x, y: positions.playerInfoCash.y, offsetX: 0, offsetY: 0 }
          }
        }),
        ...(positions.playerInfoDirty && {
          playerInfoDirty: {
            dimensions: { height: positions.playerInfoDirty.height || 50, width: positions.playerInfoDirty.width || 200 },
            offset: { x: positions.playerInfoDirty.x, y: positions.playerInfoDirty.y, offsetX: 0, offsetY: 0 }
          }
        })
      },
      settings: {
        ...currentSettings,
        resolution
      }
    }
  }

  // Copy JSON to clipboard (with fallback for blocked clipboard access)
  const copyToClipboard = () => {
    const config = JSON.stringify(generateHUDConfig(), null, 2)
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(config).then(() => {
        setAlertConfig({
          type: 'success',
          title: 'Success',
          message: 'Configuration copied to clipboard!'
        })
      }).catch(err => {
        console.error('Clipboard API failed:', err)
        // Fallback to textarea method
        fallbackCopyToClipboard(config)
      })
    } else {
      // Fallback for browsers that block clipboard API
      fallbackCopyToClipboard(config)
    }
  }

  // Fallback copy method using textarea (bypasses browser blocking)
  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '0'
      textarea.style.width = '2em'
      textarea.style.height = '2em'
      textarea.style.padding = '0'
      textarea.style.border = 'none'
      textarea.style.outline = 'none'
      textarea.style.boxShadow = 'none'
      textarea.style.background = 'transparent'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (successful) {
        setAlertConfig({
          type: 'success',
          title: 'Success',
          message: 'Configuration copied to clipboard!'
        })
      } else {
        throw new Error('Copy command failed')
      }
    } catch (err) {
      console.error('Fallback copy failed:', err)
      setAlertConfig({
        type: 'error',
        title: 'Copy Failed',
        message: 'Could not copy to clipboard. Please copy manually from the text area.'
      })
    }
  }

  // Import JSON configuration
  const handleImport = () => {
    try {
      setJsonError('')
      const config = JSON.parse(importJson)
      
      // Validate structure
      if (!config.layout || !config.settings) {
        throw new Error('Invalid configuration format')
      }
      
      // Convert layout to uiPositions
      const newPositions: any = {}
      Object.keys(config.layout).forEach(key => {
        const element = config.layout[key]
        newPositions[key] = {
          x: element.offset.x,
          y: element.offset.y,
          width: element.dimensions.width,
          height: element.dimensions.height
        }
      })
      
      // Apply configuration (includes ALL settings from imported JSON)
      // Merge positions from both layout conversion AND existing uiPositions in settings
      const mergedPositions = {
        ...newPositions,
        ...(config.settings.uiPositions || {})
      }
      
      const newSettings: HUDSettings = {
        ...config.settings,
        uiPositions: mergedPositions
      }
      
      console.log('[EditMenu] Importing settings:', newSettings)
      console.log('[EditMenu] - Style:', newSettings.style)
      console.log('[EditMenu] - Border Radius:', newSettings.borderRadius)
      console.log('[EditMenu] - Player Info Layout:', newSettings.playerInfo?.layoutStyle)
      console.log('[EditMenu] - Player Info Scale:', newSettings.playerInfo?.scale)
      console.log('[EditMenu] - Vehicle HUD Style:', newSettings.vehicleHudStyle)
      
      setCurrentSettings(newSettings)
      onSave(newSettings) // Save immediately to localStorage
      setImportJson('')
      
      setAlertConfig({
        type: 'success',
        title: 'Success',
        message: 'Configuration imported successfully! Reloading...'
      })
      
      // Close NUI and release focus before reload
      setTimeout(() => {
        
        // Close the edit menu and release NUI focus
        fetch(`https://${(window as any).GetParentResourceName()}/closeEditMenu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(err => console.log('[EditMenu] Close callback:', err))
        
        // Reload page after NUI is closed
        setTimeout(() => {
          window.location.reload()
        }, 300)
      }, 1000)
    } catch (e: any) {
      setJsonError(`Import failed: ${e.message}`)
      setAlertConfig({
        type: 'error',
        title: 'Import Failed',
        message: e.message
      })
    }
  }

  // Update settings when props change
  useEffect(() => {
    setCurrentSettings(settings)
  }, [settings])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Store latest settings in ref to avoid dependency issues
  const latestSettingsRef = useRef(currentSettings)
  useEffect(() => {
    latestSettingsRef.current = currentSettings
  }, [currentSettings])
  
  // Cleanup timers on unmount ONLY
  useEffect(() => {
    return () => {
      // Clear timers on unmount
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current)
        saveDebounceTimer.current = null
      }
      if (serverSaveTimer.current) {
        clearTimeout(serverSaveTimer.current)
        serverSaveTimer.current = null
      }
      console.log('[HUD] Cleared timers on unmount')
    }
  }, []) // Empty deps - only run on mount/unmount
  
  // Save to server when menu closes (isOpen changes from true to false) - ONE TIME ONLY
  const wasOpenRef = useRef(isOpen)
  const hasClosedRef = useRef(false)
  
  useEffect(() => {
    // Reset the closed flag when menu opens
    if (isOpen && !wasOpenRef.current) {
      hasClosedRef.current = false
    }
    
    // Only trigger ONCE when closing (was open, now closed)
    if (wasOpenRef.current && !isOpen && !hasClosedRef.current) {
      hasClosedRef.current = true // Prevent multiple triggers
      
      // If there's a pending server save, execute it immediately
      if (serverSaveTimer.current) {
        clearTimeout(serverSaveTimer.current)
        serverSaveTimer.current = null
        setIsSaving(false)
        
        // Save immediately on close
        onSave(latestSettingsRef.current)
        console.log('[HUD] Settings saved to localStorage on menu close (ONE TIME)')
      }
    }
    
    wasOpenRef.current = isOpen
  }, [isOpen, onSave]) // Only depend on isOpen and onSave

  const statusList: Array<{ key: keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>; icon: any; label: string }> = [
    { key: 'health', icon: faHeart, label: 'Health' },
    { key: 'armor', icon: faShield, label: 'Armor' },
    { key: 'hunger', icon: faBurger, label: 'Hunger' },
    { key: 'thirst', icon: faBottleWater, label: 'Thirst' },
    { key: 'oxygen', icon: faLungs, label: 'Oxygen' },
    { key: 'stress', icon: faBrain, label: 'Stress' },
  ]

  const updateSetting = (key: keyof Omit<HUDSettings, 'style' | 'borderRadius'>, field: string, value: any) => {
    const currentBar = currentSettings[key] as StatusBarSettings
    const newSettings = {
      ...currentSettings,
      [key]: {
        ...currentBar,
        [field]: value
      }
    }
    // Use universal debounced save for all settings
    debouncedSave(newSettings)
  }

  if (!isOpen) return null

  return (
    <div className="edit-menu-overlay">
      <div className="edit-menu">
        {/* Left Sidebar - All Navigation Icons */}
        <div className="edit-sidebar">
          <button 
            className={`edit-sidebar-item ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
            title="Player Health"
          >
            <FontAwesomeIcon icon={faHeart} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
            title="Vehicle HUD"
          >
            <FontAwesomeIcon icon={faCar} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'boat' ? 'active' : ''}`}
            onClick={() => setActiveTab('boat')}
            title="Boat Menu"
          >
            <FontAwesomeIcon icon={faShip} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'flight' ? 'active' : ''}`}
            onClick={() => setActiveTab('flight')}
            title="Flight HUD"
          >
            <FontAwesomeIcon icon={faPlane} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'minimap' ? 'active' : ''}`}
            onClick={() => setActiveTab('minimap')}
            title="Map & Compass"
          >
            <FontAwesomeIcon icon={faMap} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'playerinfo' ? 'active' : ''}`}
            onClick={() => setActiveTab('playerinfo')}
            title="Player Info"
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            title="Notifications"
          >
            <FontAwesomeIcon icon={faBell} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'progressbar' ? 'active' : ''}`}
            onClick={() => setActiveTab('progressbar')}
            title="Progress Bar"
          >
            <FontAwesomeIcon icon={faSpinner} />
          </button>
          <button 
            className={`edit-sidebar-item ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
            title="Import & Export"
          >
            <FontAwesomeIcon icon={faFileImport} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="edit-main-container">
          {/* Header */}
          <div className="edit-header">
            <div className="edit-title">
              <FontAwesomeIcon icon={faGear} />
              <span>HUD SETTINGS</span>
              {isSaving && (
                <span style={{ 
                  marginLeft: '12px', 
                  fontSize: '13px', 
                  color: '#fbbf24', 
                  fontWeight: 'normal',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  ● Saving...
                </span>
              )}
            </div>
            <div className="edit-actions">
              <button className="edit-action-btn" onClick={onOpenPositioningMode}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Edit Positions</span>
              </button>
              <button 
                className="edit-action-btn" 
                onClick={() => {
                  setAlertConfig({
                    type: 'confirm',
                    title: 'Reset All Settings',
                    message: 'Reset ALL HUD settings and positions to default? This will reload from default-settings.json and cannot be undone.',
                    onConfirm: () => {
                      onResetPositions()
                      // Close the menu since page will reload
                      onClose()
                    }
                  })
                }}
                style={{ background: '#ef4444' }}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Reset All Settings</span>
              </button>
              <button className="edit-close" onClick={onClose}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="edit-content-full">{activeTab === 'health' && (
          <>
          {/* Style and Border Radius */}
          <div className="edit-controls">
            <div className="control-group">
              <label>Style</label>
              <select value={style} onChange={(e) => updateStyle(e.target.value as any)}>
                <option value="progressOutline">Progress Outline</option>
                <option value="progressFill">Progress Fill</option>
                <option value="percentages">Percentages</option>
                <option value="progressBar">Progress Bar</option>
              </select>
            </div>
            <div className="control-group">
              <label>Border Radius</label>
              <select value={borderRadius} onChange={(e) => updateBorderRadius(e.target.value as any)}>
                <option value="fullyRounded">Fully Rounded</option>
                <option value="slightlyRounded">Slightly Rounded</option>
                <option value="square">Square</option>
              </select>
            </div>
            <div className="control-group">
              <label>Speed Unit</label>
              <select 
                value={currentSettings.speedUnit || 'kmh'} 
                onChange={(e) => {
                  const newSettings = { ...currentSettings, speedUnit: e.target.value as 'kmh' | 'mph' }
                  setCurrentSettings(newSettings)
                  onSave(newSettings)
                }}
              >
                <option value="kmh">Kilometers (KMH)</option>
                <option value="mph">Miles (MPH)</option>
              </select>
            </div>
          </div>

          {/* All Status Cards in Grid */}
          <div className="all-cards-grid">
            {statusList.map((status) => {
              const statusSettings = currentSettings[status.key] as StatusBarSettings
              const getBorderRadiusStyle = () => {
                if (borderRadius === 'fullyRounded') return '50%'
                if (borderRadius === 'slightlyRounded') return '12px'
                return '4px'
              }

              return (
                <div key={status.key} className="status-card">
                  <div className="preview-icon-container">
                    <svg width="60" height="60" style={{ position: 'absolute' }}>
                      {/* Background circle */}
                      <circle
                        cx="30"
                        cy="30"
                        r="22"
                        fill="none"
                        stroke="rgba(0, 0, 0, 0.3)"
                        strokeWidth="3"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="30"
                        cy="30"
                        r="22"
                        fill="none"
                        stroke={statusSettings.progressColor}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 22 * 0.75} ${2 * Math.PI * 22}`}
                        strokeLinecap="round"
                        transform="rotate(-90 30 30)"
                        style={{ 
                          filter: `drop-shadow(0 0 4px ${statusSettings.shadowColor})`
                        }}
                      />
                    </svg>
                    <div 
                      className="preview-icon-bg"
                      style={{
                        background: statusSettings.bgColor,
                        borderRadius: getBorderRadiusStyle()
                      }}
                    >
                      <FontAwesomeIcon icon={status.icon} style={{ color: statusSettings.iconColor }} />
                    </div>
                  </div>
                  
                  {/* Visibility Slider - Dual Handle */}
                  <div className="visibility-section">
                    <label>Visible between</label>
                    <div className="dual-range-slider">
                      <div className="range-track">
                        <div 
                          className="range-fill"
                          style={{
                            left: `${statusSettings.visibleMin}%`,
                            width: `${statusSettings.visibleMax - statusSettings.visibleMin}%`
                          }}
                        ></div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={statusSettings.visibleMin}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (val < statusSettings.visibleMax) {
                              updateSetting(status.key, 'visibleMin', val)
                            }
                          }}
                          className="range-input range-min"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={statusSettings.visibleMax}
                          onChange={(e) => {
                            const val = parseInt(e.target.value)
                            if (val > statusSettings.visibleMin) {
                              updateSetting(status.key, 'visibleMax', val)
                            }
                          }}
                          className="range-input range-max"
                        />
                      </div>
                      <div className="range-labels">
                        <span>{statusSettings.visibleMin}%</span>
                        <span>{statusSettings.visibleMax}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Color Pickers */}
                  <div className="color-section">
                    <div className="color-field">
                      <label>Background Colour</label>
                      <div className="color-picker-row">
                        <div 
                          className="color-preview-box" 
                          style={{ background: statusSettings.bgColor }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const uniqueId = `${status.key}-bgColor`
                            setActiveColorPicker({ key: status.key, field: 'bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId })
                          }}
                        ></div>
                        <input
                          type="text"
                          className="color-input"
                          value={statusSettings.bgColor}
                          onChange={(e) => updateSetting(status.key, 'bgColor', e.target.value)}
                          placeholder="#RRGGBBAA"
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <label>Progress Bar Colour</label>
                      <div className="color-picker-row">
                        <div 
                          className="color-preview-box" 
                          style={{ background: statusSettings.progressColor }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const uniqueId = `${status.key}-progressColor`
                            setActiveColorPicker({ key: status.key, field: 'progressColor', position: { x: rect.right + 10, y: rect.top }, uniqueId })
                          }}
                        ></div>
                        <input
                          type="text"
                          className="color-input"
                          value={statusSettings.progressColor}
                          onChange={(e) => updateSetting(status.key, 'progressColor', e.target.value)}
                          placeholder="#RRGGBBAA"
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <label>Icon Colour</label>
                      <div className="color-picker-row">
                        <div 
                          className="color-preview-box" 
                          style={{ background: statusSettings.iconColor }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const uniqueId = `${status.key}-iconColor`
                            setActiveColorPicker({ key: status.key, field: 'iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId })
                          }}
                        ></div>
                        <input
                          type="text"
                          className="color-input"
                          value={statusSettings.iconColor}
                          onChange={(e) => updateSetting(status.key, 'iconColor', e.target.value)}
                          placeholder="#RRGGBBAA"
                        />
                      </div>
                    </div>

                    <div className="color-field">
                      <label>Shadow Colour</label>
                      <div className="color-picker-row">
                        <div 
                          className="color-preview-box" 
                          style={{ background: statusSettings.shadowColor }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const uniqueId = `${status.key}-shadowColor`
                            setActiveColorPicker({ key: status.key, field: 'shadowColor', position: { x: rect.right + 10, y: rect.top }, uniqueId })
                          }}
                        ></div>
                        <input
                          type="text"
                          className="color-input"
                          value={statusSettings.shadowColor}
                          onChange={(e) => updateSetting(status.key, 'shadowColor', e.target.value)}
                          placeholder="#RRGGBBAA"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          </>
        )}

        {activeTab === 'vehicle' && (
          <div className="vehicle-hud-settings">
            {/* Seatbelt Sound Settings - TOGGLE SWITCH */}
            <div className="control-group" style={{ marginBottom: '30px', padding: '20px', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
              <label style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'block', color: '#3b82f6' }}>
                🔊 SEATBELT SOUND SETTINGS
              </label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>
                  Enable All Seatbelt Sounds
                </span>
                {/* Toggle Switch */}
                <div 
                  onClick={() => {
                    const newValue = !(currentSettings.seatbeltSoundsEnabled ?? true)
                    const newSettings = { ...currentSettings, seatbeltSoundsEnabled: newValue }
                    debouncedSave(newSettings)
                  }}
                  style={{
                    width: '60px',
                    height: '30px',
                    borderRadius: '15px',
                    background: (currentSettings.seatbeltSoundsEnabled ?? true) ? '#22c55e' : '#ef4444',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    position: 'absolute',
                    top: '2px',
                    left: (currentSettings.seatbeltSoundsEnabled ?? true) ? '32px' : '2px',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: (currentSettings.seatbeltSoundsEnabled ?? true) ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '6px',
                border: `1px solid ${(currentSettings.seatbeltSoundsEnabled ?? true) ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <p style={{ fontSize: '14px', color: '#bbb', margin: 0, lineHeight: '1.5' }}>
                  {currentSettings.seatbeltSoundsEnabled ?? true 
                    ? 'Status: ON - All seatbelt sounds are playing (alarm + on/off sounds)' 
                    : 'Status: OFF - All seatbelt sounds are muted (complete silence)'}
                </p>
              </div>
            </div>

            <div className="style-selector">
              <label>VEHICLE HUD STYLE</label>
              <div className="style-options" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <button 
                  className={`style-btn ${(currentSettings.vehicleHudStyle || 'default') === 'default' ? 'active' : ''}`}
                  onClick={() => {
                    const newSettings = { ...currentSettings, vehicleHudStyle: 'default' as const }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '12px',
                    minHeight: '180px'
                  }}
                >
                  <img 
                    src="../img/vehicle-hud/vehicle-hud1.png" 
                    alt="Default HUD" 
                    onError={(e) => {
                      console.error('[EditMenu] Failed to load vehicle-hud1.png from ../img/vehicle-hud/')
                      e.currentTarget.style.display = 'none'
                    }}
                    style={{ 
                      width: '100%', 
                      height: '120px', 
                      objectFit: 'contain', 
                      marginBottom: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(100, 150, 200, 0.1)'
                    }} 
                  />
                  <span style={{ fontWeight: '600' }}>Default HUD</span>
                  <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Classic speedometer layout</small>
                </button>
                <button 
                  className={`style-btn ${currentSettings.vehicleHudStyle === 'circular' ? 'active' : ''}`}
                  onClick={() => {
                    const newSettings = { ...currentSettings, vehicleHudStyle: 'circular' as const }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '12px',
                    minHeight: '180px'
                  }}
                >
                  <img 
                    src="../img/vehicle-hud/vehicle-hud2.png" 
                    alt="Circular HUD" 
                    onError={(e) => {
                      console.error('[EditMenu] Failed to load vehicle-hud2.png from ../img/vehicle-hud/')
                      e.currentTarget.style.display = 'none'
                    }}
                    style={{ 
                      width: '100%', 
                      height: '120px', 
                      objectFit: 'contain', 
                      marginBottom: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(100, 150, 200, 0.1)'
                    }} 
                  />
                  <span style={{ fontWeight: '600' }}>Circular HUD</span>
                  <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Modern circular speedometer</small>
                </button>
                <button 
                  className={`style-btn ${currentSettings.vehicleHudStyle === 'style3' ? 'active' : ''}`}
                  onClick={() => {
                    const newSettings = { ...currentSettings, vehicleHudStyle: 'style3' as const }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '12px',
                    minHeight: '180px'
                  }}
                >
                  <img 
                    src="../img/vehicle-hud/vehicle-hud3.png" 
                    alt="Style 3 HUD" 
                    onError={(e) => {
                      console.error('[EditMenu] Failed to load vehicle-hud3.png from ../img/vehicle-hud/')
                      e.currentTarget.style.display = 'none'
                    }}
                    style={{ 
                      width: '100%', 
                      height: '120px', 
                      objectFit: 'contain', 
                      marginBottom: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(100, 150, 200, 0.1)'
                    }} 
                  />
                  <span style={{ fontWeight: '600' }}>Style 3 HUD</span>
                  <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Horizontal bar speedometer</small>
                </button>
                <button 
                  className={`style-btn ${currentSettings.vehicleHudStyle === 'style4' ? 'active' : ''}`}
                  onClick={() => {
                    const newSettings = { ...currentSettings, vehicleHudStyle: 'style4' as const }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    padding: '12px',
                    minHeight: '180px'
                  }}
                >
                  <img 
                    src="../img/vehicle-hud/vehicle-hud4.png" 
                    alt="Style 4 HUD" 
                    onError={(e) => {
                      console.error('[EditMenu] Failed to load vehicle-hud4.png from ../img/vehicle-hud/')
                      e.currentTarget.style.display = 'none'
                    }}
                    style={{ 
                      width: '100%', 
                      height: '120px', 
                      objectFit: 'contain', 
                      marginBottom: '8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(100, 150, 200, 0.1)'
                    }} 
                  />
                  <span style={{ fontWeight: '600' }}>Style 4 HUD</span>
                  <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Circular gauge with RPM stick</small>
                </button>
              </div>
            </div>
            
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', marginTop: '20px' }}>
              <p>More vehicle HUD customization options coming soon...</p>
            </div>
          </div>
        )}

        {activeTab === 'boat' && (
          <div className="boat-menu-settings">
            {/* Use Vehicle HUD for Boats Toggle */}
            <div className="style-selector">
              <label>BOAT HUD MODE</label>
              <div className="toggle-option" style={{ marginBottom: '20px' }}>
                <label className="toggle-switch" style={{ marginRight: '15px' }}>
                  <input 
                    type="checkbox" 
                    checked={currentSettings.useVehicleHudForBoats || false}
                    onChange={(e) => {
                      const newSettings = { ...currentSettings, useVehicleHudForBoats: e.target.checked }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <div>
                  <strong style={{ color: '#ffffff' }}>Use Vehicle HUDs for Boats</strong>
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                    When ENABLED: Boats will use regular vehicle HUD styles (1-4).<br/>
                    When DISABLED: Boats will use dedicated Boat HUDs only.
                  </p>
                </div>
              </div>
            </div>

            {/* Boat HUD Style Selection (only if not using vehicle HUDs) */}
            {!currentSettings.useVehicleHudForBoats && (
              <div className="style-selector">
                <label>BOAT HUD STYLE</label>
                <div className="style-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <button 
                    className={`style-btn ${(currentSettings.boatHudStyle || 'boat2') === 'boat1' ? 'active' : ''}`}
                    onClick={() => {
                      const newSettings = { ...currentSettings, boatHudStyle: 'boat1' as const }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '12px',
                      minHeight: '180px'
                    }}
                  >
                    <img 
                      src="../img/vehicle-hud/boat-hud1.png" 
                      alt="Boat HUD 1" 
                      onError={(e) => {
                        console.error('[EditMenu] Failed to load boat-hud1.png from ../img/vehicle-hud/')
                        e.currentTarget.style.display = 'none'
                      }}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'contain', 
                        marginBottom: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 150, 200, 0.1)'
                      }} 
                    />
                    <span style={{ fontWeight: '600' }}>Boat HUD 1</span>
                    <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Circular gauges with status bar</small>
                  </button>
                  <button 
                    className={`style-btn ${currentSettings.boatHudStyle === 'boat2' ? 'active' : ''}`}
                    onClick={() => {
                      const newSettings = { ...currentSettings, boatHudStyle: 'boat2' as const }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '12px',
                      minHeight: '180px'
                    }}
                  >
                    <img 
                      src="../img/vehicle-hud/boat-hud2.png" 
                      alt="Boat HUD 2" 
                      onError={(e) => {
                        console.error('[EditMenu] Failed to load boat-hud2.png from ../img/vehicle-hud/')
                        e.currentTarget.style.display = 'none'
                      }}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'contain', 
                        marginBottom: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 150, 200, 0.1)'
                      }} 
                    />
                    <span style={{ fontWeight: '600' }}>Boat HUD 2</span>
                    <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Horizontal bars with direction card</small>
                  </button>
                  <button 
                    className={`style-btn ${currentSettings.boatHudStyle === 'boat3' ? 'active' : ''}`}
                    onClick={() => {
                      const newSettings = { ...currentSettings, boatHudStyle: 'boat3' as const }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '12px',
                      minHeight: '180px'
                    }}
                  >
                    <img 
                      src="../img/vehicle-hud/boat-hud3.png" 
                      alt="Boat HUD 3" 
                      onError={(e) => {
                        console.error('[EditMenu] Failed to load boat-hud3.png from ../img/vehicle-hud/')
                        e.currentTarget.style.display = 'none'
                      }}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'contain', 
                        marginBottom: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 150, 200, 0.1)'
                      }} 
                    />
                    <span style={{ fontWeight: '600' }}>Boat HUD 3</span>
                    <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Maritime cards with navigation</small>
                  </button>
                </div>
              </div>
            )}

            {/* Boat Speed Unit */}
            {!currentSettings.useVehicleHudForBoats && (
              <div className="control-group" style={{ marginTop: '20px' }}>
                <label>BOAT SPEED UNIT</label>
                <select 
                  value={currentSettings.boatSpeedUnit || 'mph'} 
                  onChange={(e) => {
                    const newSettings = { ...currentSettings, boatSpeedUnit: e.target.value as 'kmh' | 'mph' }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                >
                  <option value="kmh">Kilometers (KMH)</option>
                  <option value="mph">Miles (MPH)</option>
                </select>
              </div>
            )}

            {/* Info Section */}
            <div style={{ 
              background: 'rgba(0, 217, 255, 0.1)', 
              border: '2px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginTop: '30px'
            }}>
              <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Boat HUD Features:</h3>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0, 
                color: '#cccccc',
                textAlign: 'left'
              }}>
                <li style={{ marginBottom: '10px' }}>⚓ Anchor System - Press F4 to toggle anchor</li>
                <li style={{ marginBottom: '10px' }}>⛽ Fuel Progress Bar - Monitor fuel level</li>
                <li style={{ marginBottom: '10px' }}>🔧 Engine Health Bar - Track engine condition</li>
                <li style={{ marginBottom: '10px' }}>💡 Status Indicators - ENGINE, LIGHT, ANCHOR (green when active)</li>
                <li style={{ marginBottom: '10px' }}>🧭 Direction Display - N, S, E, W, NE, NW, SE, SW</li>
                <li style={{ marginBottom: '10px' }}>🚤 Speed Display - KMH or MPH</li>
              </ul>
            </div>

            <div style={{ 
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255, 165, 0, 0.1)',
              border: '2px solid rgba(255, 165, 0, 0.3)',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffa500', fontWeight: 'bold', marginBottom: '8px' }}>
                ⚓ Anchor Controls
              </p>
              <p style={{ color: '#cccccc', fontSize: '14px' }}>
                When anchor is active, your boat will stay in place but can still wave with water currents.
                The boat won't drift away but maintains realistic water physics.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'flight' && (
          <div className="flight-menu-settings">
            {/* Flight HUD Enable/Disable Toggle */}
            <div className="style-selector">
              <label>FLIGHT HUD</label>
              <div className="toggle-option" style={{ marginBottom: '30px' }}>
                <label className="toggle-switch" style={{ marginRight: '15px' }}>
                  <input 
                    type="checkbox" 
                    checked={currentSettings.flightHudEnabled !== false}
                    onChange={(e) => {
                      const newSettings = { ...currentSettings, flightHudEnabled: e.target.checked }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <div>
                  <strong style={{ color: '#ffffff' }}>Enable Flight HUD</strong>
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                    Turn ON/OFF the Flight HUD display when in aircraft.
                  </p>
                </div>
              </div>
            </div>

            {/* Use Vehicle HUD for Aircraft Toggle */}
            {currentSettings.flightHudEnabled !== false && (
              <div className="style-selector">
                <label>FLIGHT HUD MODE</label>
                <div className="toggle-option" style={{ marginBottom: '20px' }}>
                  <label className="toggle-switch" style={{ marginRight: '15px' }}>
                    <input 
                      type="checkbox" 
                      checked={currentSettings.useVehicleHudForAircraft || false}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, useVehicleHudForAircraft: e.target.checked }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Use Vehicle HUDs for Aircraft</strong>
                    <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                      When ENABLED: Aircraft will use regular vehicle HUD styles (1-4).<br/>
                      When DISABLED: Aircraft will use dedicated Flight HUD with aviation instruments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Flight HUD Style Selection (only if not using vehicle HUDs) */}
            {currentSettings.flightHudEnabled !== false && !currentSettings.useVehicleHudForAircraft && (
              <div className="style-selector">
                <label>FLIGHT HUD STYLE</label>
                <div className="style-options" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                  <button 
                    className={`style-btn ${(currentSettings.flightHudStyle || 'flight1') === 'flight1' ? 'active' : ''}`}
                    onClick={() => {
                      const newSettings = { ...currentSettings, flightHudStyle: 'flight1' as const }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      padding: '12px',
                      minHeight: '180px'
                    }}
                  >
                    <img 
                      src="../img/vehicle-hud/flight-hud.png" 
                      alt="Flight HUD 1" 
                      onError={(e) => {
                        console.error('[EditMenu] Failed to load flight-hud.png from ../img/vehicle-hud/')
                        e.currentTarget.style.display = 'none'
                      }}
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'contain', 
                        marginBottom: '8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0, 119, 182, 0.1)'
                      }} 
                    />
                    <span style={{ fontWeight: '600' }}>Flight HUD 1</span>
                    <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Digital flight instruments</small>
                  </button>
                </div>
              </div>
            )}

            {/* Flight Speed Unit */}
            {currentSettings.flightHudEnabled !== false && !currentSettings.useVehicleHudForAircraft && (
              <div className="control-group" style={{ marginTop: '20px' }}>
                <label>AIRSPEED UNIT</label>
                <select 
                  value={currentSettings.flightSpeedUnit || 'mph'} 
                  onChange={(e) => {
                    const newSettings = { ...currentSettings, flightSpeedUnit: e.target.value as 'kmh' | 'mph' | 'knots' }
                    setCurrentSettings(newSettings)
                    onSave(newSettings)
                  }}
                >
                  <option value="kmh">Kilometers per Hour (KMH)</option>
                  <option value="mph">Miles per Hour (MPH)</option>
                  <option value="knots">Knots (KTS)</option>
                </select>
              </div>
            )}

            {currentSettings.flightHudEnabled !== false && (
              <>
              <div style={{ 
                background: 'rgba(0, 119, 182, 0.1)',
                border: '2px solid rgba(0, 119, 182, 0.3)',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '30px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Flight HUD Features:</h3>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  color: '#cccccc',
                  textAlign: 'left'
                }}>
                  <li style={{ marginBottom: '10px' }}>✈️ Airspeed Indicator - Shows speed in knots (KTS)</li>
                  <li style={{ marginBottom: '10px' }}>🎯 Attitude Indicator - Artificial horizon with pitch and roll</li>
                  <li style={{ marginBottom: '10px' }}>�u Altimeter - Altitude in feet (FT) with dual needles</li>
                  <li style={{ marginBottom: '10px' }}>🔄 Turn Coordinator - Shows turn rate and coordination</li>
                  <li style={{ marginBottom: '10px' }}>🧭 Heading Indicator - Compass heading 0-360°</li>
                  <li style={{ marginBottom: '10px' }}>📊 Vertical Speed - Climb/descent rate in feet per minute (FPM)</li>
                </ul>
              </div>

              <div style={{ 
                marginTop: '20px',
                padding: '15px',
                background: 'rgba(255, 165, 0, 0.1)',
                border: '2px solid rgba(255, 165, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#ffa500', fontWeight: 'bold', marginBottom: '8px' }}>
                  ⚠️ Warning Indicators
                </p>
                <p style={{ color: '#cccccc', fontSize: '14px' }}>
                  Gauges will pulse with warning colors when critical:<br/>
                  • Airspeed: Orange pulse when too fast (&gt;180 KTS) or too slow (&lt;40 KTS)<br/>
                  • Altitude: Red pulse when below 500 feet<br/>
                  • Vertical Speed: Orange pulse when engine health is low
                </p>
              </div>
              </>
            )}

            {/* HELICOPTER SETTINGS */}
            <div style={{ 
              marginTop: '40px',
              paddingTop: '30px',
              borderTop: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ color: '#ffffff', marginBottom: '20px', fontSize: '18px' }}>🚁 HELICOPTER HUD SETTINGS</h2>
              
              {/* Use Vehicle HUD for Helicopters Toggle */}
              <div className="style-selector">
                <label>HELICOPTER HUD MODE</label>
                <div className="toggle-option" style={{ marginBottom: '20px' }}>
                  <label className="toggle-switch" style={{ marginRight: '15px' }}>
                    <input 
                      type="checkbox" 
                      checked={currentSettings.useVehicleHudForHelicopters || false}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, useVehicleHudForHelicopters: e.target.checked }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <div>
                    <strong style={{ color: '#ffffff' }}>Use Vehicle HUDs for Helicopters</strong>
                    <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                      When ENABLED: Helicopters will use regular vehicle HUD styles (1-4).<br/>
                      When DISABLED: Helicopters will use dedicated Helicopter HUD with aviation instruments.
                    </p>
                  </div>
                </div>
              </div>

              {/* Helicopter HUD Style Selection (only if not using vehicle HUDs) */}
              {!currentSettings.useVehicleHudForHelicopters && (
                <div className="style-selector">
                  <label>HELICOPTER HUD STYLE</label>
                  <div className="style-options" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                    <button 
                      className={`style-btn ${(currentSettings.helicopterHudStyle || 'heli1') === 'heli1' ? 'active' : ''}`}
                      onClick={() => {
                        const newSettings = { ...currentSettings, helicopterHudStyle: 'heli1' as const }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        padding: '12px',
                        minHeight: '180px'
                      }}
                    >
                      <img 
                        src="../img/vehicle-hud/helicopter-hud.png" 
                        alt="Helicopter HUD 1" 
                        onError={(e) => {
                          console.error('[EditMenu] Failed to load helicopter-hud.png from ../img/vehicle-hud/')
                          e.currentTarget.style.display = 'none'
                        }}
                        style={{ 
                          width: '100%', 
                          height: '120px', 
                          objectFit: 'contain', 
                          marginBottom: '8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 119, 182, 0.1)'
                        }} 
                      />
                      <span style={{ fontWeight: '600' }}>Helicopter HUD 1</span>
                      <small style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', textAlign: 'center' }}>Digital helicopter instruments</small>
                    </button>
                  </div>
                </div>
              )}

              {/* Helicopter Speed Unit */}
              {!currentSettings.useVehicleHudForHelicopters && (
                <div className="control-group" style={{ marginTop: '20px' }}>
                  <label>AIRSPEED UNIT</label>
                  <select 
                    value={currentSettings.helicopterSpeedUnit || 'mph'} 
                    onChange={(e) => {
                      const newSettings = { ...currentSettings, helicopterSpeedUnit: e.target.value as 'kmh' | 'mph' | 'knots' }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                  >
                    <option value="kmh">Kilometers per Hour (KMH)</option>
                    <option value="mph">Miles per Hour (MPH)</option>
                    <option value="knots">Knots (KTS)</option>
                  </select>
                </div>
              )}

              <div style={{ 
                background: 'rgba(0, 182, 119, 0.1)',
                border: '2px solid rgba(0, 182, 119, 0.3)',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '20px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '15px' }}>Helicopter HUD Features:</h3>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  color: '#cccccc',
                  textAlign: 'left'
                }}>
                  <li style={{ marginBottom: '10px' }}>🚁 Pitch Indicator - Shows nose up/down angle</li>
                  <li style={{ marginBottom: '10px' }}>🔄 Roll Indicator - Shows left/right tilt angle</li>
                  <li style={{ marginBottom: '10px' }}>📏 Altimeter - Height above ground in feet (FT)</li>
                  <li style={{ marginBottom: '10px' }}>🧭 Heading - Compass direction with cardinal points</li>
                  <li style={{ marginBottom: '10px' }}>💨 Airspeed - Speed in KMH/MPH/KTS</li>
                  <li style={{ marginBottom: '10px' }}>⛽ Fuel Gauge - Fuel percentage with low fuel warning</li>
                  <li style={{ marginBottom: '10px' }}>🔧 Status Indicators - Engine, Lights, Fuel, Rotor</li>
                </ul>
              </div>

              <div style={{ 
                marginTop: '15px',
                padding: '15px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px'
              }}>
                <p style={{ color: '#3b82f6', fontWeight: 'bold', marginBottom: '8px' }}>
                  ℹ️ Helicopter vs Plane HUD
                </p>
                <p style={{ color: '#cccccc', fontSize: '14px' }}>
                  Helicopter HUD is optimized for rotorcraft:<br/>
                  • No stall warning (helicopters don't stall like planes)<br/>
                  • No landing gear indicator (most have fixed gear)<br/>
                  • Rotor status indicator instead<br/>
                  • Same digital green display style
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'minimap' && (
          <div className="map-compass-settings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* MINIMAP SECTION */}
              <div>
                <h3 style={{ color: '#6496c8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Minimap</h3>
                
                {/* Minimap Style */}
                <div className="control-group">
                  <label>MINIMAP STYLE</label>
                  <select 
                    value={currentSettings.minimap?.minimapStyle || 'rounded'}
                    onChange={(e) => {
                      const minimapStyle = e.target.value as 'square' | 'rounded'
                      const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, minimapStyle } }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                      
                      console.log('[EditMenu] Minimap style changed to:', minimapStyle)
                      
                      // Send minimap style change to client immediately via NUI callback
                      fetch(`https://${(window as any).GetParentResourceName()}/setMinimapStyle`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ minimapStyle })
                      }).catch(err => console.error('Failed to update minimap style:', err))
                    }}
                  >
                    <option value="square">Square Minimap</option>
                    <option value="rounded">Rounded Minimap</option>
                  </select>
                </div>
              </div>

              {/* COMPASS SECTION */}
              <div>
                <h3 style={{ color: '#6496c8', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>Compass</h3>
                
                {/* Compass Border Radius */}
                <div className="control-group" style={{ marginBottom: '16px' }}>
                  <label>Compass Border Radius</label>
                  <select 
                    value={currentSettings.minimap?.compassBorderRadius || 'rounded'}
                    onChange={(e) => {
                      const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassBorderRadius: e.target.value as 'square' | 'circle' | 'rounded' } }
                      setCurrentSettings(newSettings)
                      onSave(newSettings)
                    }}
                  >
                    <option value="square">Square</option>
                    <option value="circle">Circle</option>
                    <option value="rounded">Slightly Rounded</option>
                  </select>
                </div>

                {/* Compass Primary Color */}
                <div className="control-group" style={{ marginBottom: '16px' }}>
                  <label>COMPASS PRIMARY COLOUR</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={(currentSettings.minimap?.compassPrimaryColor || '#ffffff').substring(0, 7)}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassPrimaryColor: e.target.value } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                        console.log('[EditMenu] Compass primary color changed to:', e.target.value)
                      }}
                      style={{ 
                        width: '60px', 
                        height: '40px', 
                        border: '2px solid rgba(100, 150, 200, 0.3)', 
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={currentSettings.minimap?.compassPrimaryColor || '#ffffff'}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassPrimaryColor: e.target.value } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                      placeholder="#FFFFFF"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(100, 150, 200, 0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Compass Background Color */}
                <div className="control-group" style={{ marginBottom: '16px' }}>
                  <label>COMPASS BACKGROUND COLOUR</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={(currentSettings.minimap?.compassBgColor || '#000000').substring(0, 7)}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassBgColor: e.target.value + '80' } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                        console.log('[EditMenu] Compass background color changed to:', e.target.value + '80')
                      }}
                      style={{ 
                        width: '60px', 
                        height: '40px', 
                        border: '2px solid rgba(100, 150, 200, 0.3)', 
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={currentSettings.minimap?.compassBgColor || '#00000080'}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassBgColor: e.target.value } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                      placeholder="#00000080"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(100, 150, 200, 0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>

                {/* Compass Shadow Color */}
                <div className="control-group">
                  <label>COMPASS SHADOW COLOUR</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={(currentSettings.minimap?.compassShadowColor || '#000000').substring(0, 7)}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassShadowColor: e.target.value } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                        console.log('[EditMenu] Compass shadow color changed to:', e.target.value)
                      }}
                      style={{ 
                        width: '60px', 
                        height: '40px', 
                        border: '2px solid rgba(100, 150, 200, 0.3)', 
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={currentSettings.minimap?.compassShadowColor || '#000000'}
                      onChange={(e) => {
                        const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, compassShadowColor: e.target.value } }
                        setCurrentSettings(newSettings)
                        onSave(newSettings)
                      }}
                      placeholder="#000000"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: '#1a1a1a',
                        border: '1px solid rgba(100, 150, 200, 0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'playerinfo' && (
          <div className="playerinfo-settings">
            {/* Layout Style Selection */}
            <div className="style-selector">
              <label>LAYOUT STYLE</label>
              <div className="style-options" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <button 
                  className={`style-btn ${playerInfoSettings.layoutStyle === 'miniature' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('layoutStyle', 'miniature')}
                >
                  <span>Miniature Cards</span>
                </button>
                <button 
                  className={`style-btn ${playerInfoSettings.layoutStyle === 'grid' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('layoutStyle', 'grid')}
                >
                  <span>Grid Layout</span>
                </button>
                <button 
                  className={`style-btn ${playerInfoSettings.layoutStyle === 'modern' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('layoutStyle', 'modern')}
                >
                  <span>Modern HUD</span>
                </button>
              </div>
            </div>

            {/* Card Scale Control */}
            <div className="style-selector">
              <label>CARD SCALE: {playerInfoSettings.scale || 100}%</label>
              <input 
                type="range" 
                min="70" 
                max="130" 
                value={playerInfoSettings.scale || 100}
                onChange={(e) => updatePlayerInfoSetting('scale', parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '8px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                <span>70%</span>
                <span>100%</span>
                <span>130%</span>
              </div>
            </div>

            {/* Position Button */}
            <div className="style-selector">
              <button 
                className="edit-action-btn" 
                onClick={onOpenPositioningMode}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Edit PlayerInfo Position</span>
              </button>
            </div>

            {/* Card Style Selection */}
            <div className="style-selector">
              <label>CARD STYLE</label>
              <div className="style-options" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <button 
                  className={`style-btn ${playerInfoSettings.cardStyle === 'rounded' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('cardStyle', 'rounded')}
                >
                  <span>Rounded</span>
                </button>
                <button 
                  className={`style-btn ${playerInfoSettings.cardStyle === 'square' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('cardStyle', 'square')}
                >
                  <span>Square</span>
                </button>
                <button 
                  className={`style-btn ${playerInfoSettings.cardStyle === 'angled' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('cardStyle', 'angled')}
                >
                  <span>Angled</span>
                </button>
                <button 
                  className={`style-btn ${playerInfoSettings.cardStyle === 'hexagon' ? 'active' : ''}`}
                  onClick={() => updatePlayerInfoSetting('cardStyle', 'hexagon')}
                >
                  <span>Hexagon</span>
                </button>
              </div>
            </div>

            {/* Global Background Colors */}
            <div className="global-colors-section">
              <h3>CARD BACKGROUNDS</h3>
              <div className="global-colors-grid">
                <div className="color-option">
                  <label>Icon BG</label>
                  <input 
                    type="color" 
                    value={playerInfoSettings.iconBgColor}
                    onChange={(e) => updatePlayerInfoSetting('iconBgColor', e.target.value)}
                  />
                  <span className="color-hex">{playerInfoSettings.iconBgColor}</span>
                </div>
                <div className="color-option">
                  <label>Content BG</label>
                  <input 
                    type="color" 
                    value={playerInfoSettings.contentBgColor}
                    onChange={(e) => updatePlayerInfoSetting('contentBgColor', e.target.value)}
                  />
                  <span className="color-hex">{playerInfoSettings.contentBgColor}</span>
                </div>
              </div>
            </div>

            {/* Per-Element Color Controls */}
            <div className="element-list">
              {/* Server ID */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faHashtag} className="element-icon" />
                  <span className="element-name">Server ID</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showId}
                      onChange={(e) => updatePlayerInfoSetting('showId', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.idColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'idColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'id-bg' })
                      }}
                    ></div>
                    <span className="hex-display">{playerInfoSettings.idColors.bgColor}</span>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.idColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'idColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'id-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.idColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'idColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'id-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.idColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'idColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'id-text' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Server Time */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faClock} className="element-icon" />
                  <span className="element-name">Server Time</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showTime}
                      onChange={(e) => updatePlayerInfoSetting('showTime', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.timeColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'timeColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'time-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.timeColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'timeColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'time-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.timeColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'timeColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'time-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.timeColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'timeColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'time-text' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Label</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.timeColors.labelColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'timeColors.labelColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'time-label' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Job */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faBriefcase} className="element-icon" />
                  <span className="element-name">Job</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showJob}
                      onChange={(e) => updatePlayerInfoSetting('showJob', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.jobColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'jobColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'job-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.jobColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'jobColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'job-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.jobColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'jobColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'job-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.jobColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'jobColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'job-text' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bank */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faUniversity} className="element-icon" />
                  <span className="element-name">Bank</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showBank}
                      onChange={(e) => updatePlayerInfoSetting('showBank', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.bankColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'bankColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'bank-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.bankColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'bankColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'bank-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.bankColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'bankColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'bank-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.bankColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'bankColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'bank-text' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Label</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.bankColors.labelColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'bankColors.labelColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'bank-label' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Cash */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faMoneyBill} className="element-icon" />
                  <span className="element-name">Cash</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showCash}
                      onChange={(e) => updatePlayerInfoSetting('showCash', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.cashColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'cashColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'cash-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.cashColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'cashColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'cash-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.cashColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'cashColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'cash-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.cashColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'cashColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'cash-text' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Label</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.cashColors.labelColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'cashColors.labelColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'cash-label' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Black Money */}
              <div className="element-item">
                <div className="element-header">
                  <FontAwesomeIcon icon={faSuitcase} className="element-icon" />
                  <span className="element-name">Black Money</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showDirty}
                      onChange={(e) => updatePlayerInfoSetting('showDirty', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.dirtyColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'dirtyColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'dirty-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.dirtyColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'dirtyColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'dirty-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.dirtyColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'dirtyColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'dirty-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.dirtyColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'dirtyColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'dirty-text' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Label</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.dirtyColors.labelColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'dirtyColors.labelColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'dirty-label' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Voice Indicator */}
              <div className="element-item">
                <div className="element-header">
                  <i className="bi bi-mic-fill" style={{ fontSize: '18px', width: '20px', textAlign: 'center' }}></i>
                  <span className="element-name">Voice Indicator</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={playerInfoSettings.showVoice}
                      onChange={(e) => updatePlayerInfoSetting('showVoice', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="element-colors">
                  <div className="color-row">
                    <label>Info BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.voiceColors.bgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'voiceColors.bgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'voice-bg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon BG</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.voiceColors.iconBgColor || playerInfoSettings.iconBgColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'voiceColors.iconBgColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'voice-iconbg' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Icon</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.voiceColors.iconColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'voiceColors.iconColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'voice-icon' })
                      }}
                    ></div>
                  </div>
                  <div className="color-row">
                    <label>Text</label>
                    <div 
                      className="color-preview-box" 
                      style={{ background: playerInfoSettings.voiceColors.textColor }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setActivePlayerInfoColorPicker({ colorPath: 'voiceColors.textColor', position: { x: rect.right + 10, y: rect.top }, uniqueId: 'voice-text' })
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Transparency */}
            <div className="transparency-control">
              <label>CARD TRANSPARENCY</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={playerInfoSettings.transparency}
                onChange={(e) => updatePlayerInfoSetting('transparency', parseInt(e.target.value))}
              />
              <span className="transparency-value">{playerInfoSettings.transparency}%</span>
            </div>

            {/* Server Logo Toggle */}
            <div className="style-selector" style={{ marginTop: '30px' }}>
              <label>SERVER LOGO</label>
              <div className="toggle-option" style={{ marginTop: '12px' }}>
                <label className="toggle-switch" style={{ marginRight: '15px' }}>
                  <input 
                    type="checkbox" 
                    checked={playerInfoSettings.showLogo}
                    onChange={(e) => updatePlayerInfoSetting('showLogo', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <div>
                  <strong style={{ color: '#ffffff' }}>Show Server Logo</strong>
                  <p style={{ color: '#888', fontSize: '13px', marginTop: '5px' }}>
                    Display the server logo at the top of the screen (configured in config.lua)
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notification-settings">
            <h2 style={{ color: '#6496c8', fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>NOTIFICATION SETTINGS</h2>
            
            {/* Position Selection */}
            <div className="control-group" style={{ marginBottom: '24px' }}>
              <label>NOTIFICATION POSITION</label>
              <select 
                value={currentSettings.notification?.position || 'top-right'}
                onChange={(e) => {
                  const newSettings = { 
                    ...currentSettings, 
                    notification: { 
                      ...currentSettings.notification || {
                        position: 'top-right',
                        style: 'style1',
                        successColor: '#22c55e',
                        errorColor: '#ef4444',
                        warningColor: '#f59e0b',
                        infoColor: '#3b82f6',
                        bgColor: '#1a1a1a',
                        textColor: '#ffffff',
                        timerColor: '#6496c8',
                        transparency: 90
                      }, 
                      position: e.target.value as any 
                    } 
                  }
                  debouncedSave(newSettings)
                }}
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



            {/* Color Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="color-field">
                <label>Success Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.successColor || '#22c55e'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        successColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Error Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.errorColor || '#ef4444'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        errorColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Warning Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.warningColor || '#f59e0b'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        warningColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Info Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.infoColor || '#3b82f6'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        infoColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Background Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.bgColor || '#1a1a1a'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        bgColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Text Color</label>
                <input 
                  type="color" 
                  value={currentSettings.notification?.textColor || '#ffffff'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      notification: { 
                        ...currentSettings.notification || {
                          position: 'top-right',
                          style: 'style1',
                          successColor: '#22c55e',
                          errorColor: '#ef4444',
                          warningColor: '#f59e0b',
                          infoColor: '#3b82f6',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#6496c8',
                          transparency: 90
                        }, 
                        textColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Transparency */}
            <div className="transparency-control" style={{ marginBottom: '24px' }}>
              <label>TRANSPARENCY</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentSettings.notification?.transparency || 90}
                onChange={(e) => {
                  const newSettings = { 
                    ...currentSettings, 
                    notification: { 
                      ...currentSettings.notification || {
                        position: 'top-right',
                        style: 'style1',
                        successColor: '#22c55e',
                        errorColor: '#ef4444',
                        warningColor: '#f59e0b',
                        infoColor: '#3b82f6',
                        bgColor: '#1a1a1a',
                        textColor: '#ffffff',
                        timerColor: '#6496c8',
                        transparency: 90
                      }, 
                      transparency: parseInt(e.target.value) 
                    } 
                  }
                  debouncedSave(newSettings)
                }}
              />
              <span className="transparency-value">{currentSettings.notification?.transparency || 90}%</span>
            </div>

            {/* Test Button */}
            <button 
              onClick={() => {
                // Send test notification directly to the notification system
                window.postMessage({
                  action: 'showNotification',
                  data: {
                    type: 'success',
                    title: 'Test Notification',
                    message: 'This is how your notifications will appear in-game!',
                    duration: 3000
                  }
                }, '*')
              }}
              style={{
                padding: '12px 24px',
                background: '#22c55e',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              🔔 Test Notification
            </button>
          </div>
        )}

        {activeTab === 'progressbar' && (
          <div className="progressbar-settings">
            <h2 style={{ color: '#6496c8', fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>PROGRESS BAR SETTINGS</h2>
            
            {/* Position Selection */}
            <div className="control-group" style={{ marginBottom: '24px' }}>
              <label>PROGRESS BAR POSITION</label>
              <select 
                value={currentSettings.progressBar?.position || 'bottom-center'}
                onChange={(e) => {
                  const newSettings = { 
                    ...currentSettings, 
                    progressBar: { 
                      ...currentSettings.progressBar || {
                        position: 'bottom-center',
                        style: 'style1',
                        defaultColor: '#6496c8',
                        bgColor: '#1a1a1a',
                        textColor: '#ffffff',
                        timerColor: '#ffffff',
                        percentageColor: '#ffffff',
                        iconColor: '#ffffff',
                        transparency: 90
                      }, 
                      position: e.target.value as any 
                    } 
                  }
                  debouncedSave(newSettings)
                }}
              >
                <option value="top-center">Top Center</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>



            {/* Color Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div className="color-field">
                <label>Progress Color</label>
                <input 
                  type="color" 
                  value={currentSettings.progressBar?.defaultColor || '#6496c8'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      progressBar: { 
                        ...currentSettings.progressBar || {
                          position: 'bottom-center',
                          style: 'style1',
                          defaultColor: '#6496c8',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#ffffff',
                          percentageColor: '#ffffff',
                          iconColor: '#ffffff',
                          transparency: 90
                        }, 
                        defaultColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Background Color</label>
                <input 
                  type="color" 
                  value={currentSettings.progressBar?.bgColor || '#1a1a1a'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      progressBar: { 
                        ...currentSettings.progressBar || {
                          position: 'bottom-center',
                          style: 'style1',
                          defaultColor: '#6496c8',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#ffffff',
                          percentageColor: '#ffffff',
                          iconColor: '#ffffff',
                          transparency: 90
                        }, 
                        bgColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Text Color</label>
                <input 
                  type="color" 
                  value={currentSettings.progressBar?.textColor || '#ffffff'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      progressBar: { 
                        ...currentSettings.progressBar || {
                          position: 'bottom-center',
                          style: 'style1',
                          defaultColor: '#6496c8',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#ffffff',
                          percentageColor: '#ffffff',
                          iconColor: '#ffffff',
                          transparency: 90
                        }, 
                        textColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
              <div className="color-field">
                <label>Icon Color</label>
                <input 
                  type="color" 
                  value={currentSettings.progressBar?.iconColor || '#ffffff'}
                  onChange={(e) => {
                    const newSettings = { 
                      ...currentSettings, 
                      progressBar: { 
                        ...currentSettings.progressBar || {
                          position: 'bottom-center',
                          style: 'style1',
                          defaultColor: '#6496c8',
                          bgColor: '#1a1a1a',
                          textColor: '#ffffff',
                          timerColor: '#ffffff',
                          percentageColor: '#ffffff',
                          iconColor: '#ffffff',
                          transparency: 90
                        }, 
                        iconColor: e.target.value 
                      } 
                    }
                    debouncedSave(newSettings)
                  }}
                  style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Transparency */}
            <div className="transparency-control" style={{ marginBottom: '24px' }}>
              <label>TRANSPARENCY</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentSettings.progressBar?.transparency || 90}
                onChange={(e) => {
                  const newSettings = { 
                    ...currentSettings, 
                    progressBar: { 
                      ...currentSettings.progressBar || {
                        position: 'bottom-center',
                        style: 'style1',
                        defaultColor: '#6496c8',
                        bgColor: '#1a1a1a',
                        textColor: '#ffffff',
                        timerColor: '#ffffff',
                        percentageColor: '#ffffff',
                        iconColor: '#ffffff',
                        transparency: 90
                      }, 
                      transparency: parseInt(e.target.value) 
                    } 
                  }
                  debouncedSave(newSettings)
                }}
              />
              <span className="transparency-value">{currentSettings.progressBar?.transparency || 90}%</span>
            </div>

            {/* Test Button */}
            <button 
              onClick={() => {
                // Send test progress bar directly to the progress bar system
                window.postMessage({
                  action: 'showProgressBar',
                  data: {
                    label: 'Testing Progress Bar...',
                    duration: 5000,
                    icon: 'mdi-timer-sand'
                  }
                }, '*')
              }}
              style={{
                padding: '12px 24px',
                background: '#6496c8',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              ⏳ Test Progress Bar
            </button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-export-settings">
            <h2 style={{ color: '#6496c8', fontSize: '16px', fontWeight: '700', marginBottom: '24px' }}>IMPORT & EXPORT</h2>
            
            {/* Current Configuration */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Current Configuration</h3>
              <textarea 
                readOnly
                value={JSON.stringify(generateHUDConfig(), null, 2)}
                style={{
                  width: '100%',
                  height: '300px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(100, 150, 200, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
              <button 
                onClick={copyToClipboard}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  background: '#6496c8',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📋 Copy to Clipboard
              </button>
            </div>

            {/* Import Section */}
            <div>
              <h3 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Import Configuration</h3>
              <textarea 
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste JSON configuration here..."
                style={{
                  width: '100%',
                  height: '200px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(100, 150, 200, 0.3)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
              {jsonError && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '13px'
                }}>
                  {jsonError}
                </div>
              )}
              <button 
                onClick={handleImport}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📥 Import New
              </button>
            </div>

            {/* Info Section */}
            <div style={{
              marginTop: '32px',
              padding: '16px',
              background: 'rgba(100, 150, 200, 0.1)',
              border: '1px solid rgba(100, 150, 200, 0.3)',
              borderRadius: '8px'
            }}>
              <h4 style={{ color: '#6496c8', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>ℹ️ How to use:</h4>
              <ul style={{ color: '#cccccc', fontSize: '12px', lineHeight: '1.6', paddingLeft: '20px' }}>
                <li>Copy your current configuration to share with others</li>
                <li>Paste a configuration JSON to import settings</li>
                <li>All HUD positions, sizes, and colors will be imported</li>
                <li>Make sure to backup your current config before importing</li>
              </ul>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Color Picker Popup */}
      {activeColorPicker && (() => {
        const key = activeColorPicker.key as keyof Omit<HUDSettings, 'style' | 'borderRadius' | 'minimap'>
        const field = activeColorPicker.field
        const barSettings = currentSettings[key] as StatusBarSettings
        return (
          <ColorPicker
            key={activeColorPicker.uniqueId}
            uniqueId={activeColorPicker.uniqueId}
            color={String(barSettings[field as keyof StatusBarSettings])}
            onChange={(color) => updateSetting(key, field, color)}
            onClose={() => setActiveColorPicker(null)}
            position={activeColorPicker.position}
          />
        )
      })()}

      {/* Player Info & Minimap Color Picker Popup */}
      {activePlayerInfoColorPicker && (() => {
        const pathParts = activePlayerInfoColorPicker.colorPath.split('.')
        let colorValue: any
        
        // Handle minimap colors
        if (pathParts[0] === 'minimap') {
          colorValue = currentSettings.minimap as any
          for (let i = 1; i < pathParts.length; i++) {
            colorValue = colorValue?.[pathParts[i]]
          }
          // Set defaults if undefined
          if (!colorValue) {
            if (pathParts[pathParts.length - 1] === 'compassPrimaryColor') colorValue = '#ffffff'
            else if (pathParts[pathParts.length - 1] === 'compassBgColor') colorValue = '#00000080'
            else if (pathParts[pathParts.length - 1] === 'compassShadowColor') colorValue = '#000000'
          }
        } else {
          // Handle player info colors
          colorValue = playerInfoSettings as any
          for (const part of pathParts) {
            colorValue = colorValue[part]
          }
        }
        
        return (
          <ColorPicker
            key={activePlayerInfoColorPicker.uniqueId}
            uniqueId={activePlayerInfoColorPicker.uniqueId}
            color={String(colorValue || '#ffffff')}
            onChange={(color) => {
              const pathParts = activePlayerInfoColorPicker.colorPath.split('.')
              
              if (pathParts[0] === 'minimap') {
                // Update minimap color
                const lastPart = pathParts.pop()!
                const newSettings = { ...currentSettings, minimap: { ...currentSettings.minimap, [lastPart]: color } }
                debouncedSave(newSettings)
              } else {
                // Update player info color
                const lastPart = pathParts.pop()!
                const parentPath = pathParts[0]
                const parentObj = playerInfoSettings[parentPath as keyof typeof playerInfoSettings] as any
                
                const newPlayerInfo = { ...playerInfoSettings, [parentPath]: { ...parentObj, [lastPart]: color } }
                const newSettings = { ...currentSettings, playerInfo: newPlayerInfo }
                debouncedSave(newSettings)
              }
            }}
            onClose={() => setActivePlayerInfoColorPicker(null)}
            position={activePlayerInfoColorPicker.position}
          />
        )
      })()}

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig(null)}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel}
        />
      )}
    </div>
  )
}

export default EditMenu
