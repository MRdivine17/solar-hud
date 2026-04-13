import { useState, useEffect, useCallback } from 'react'
import './fontawesome' // Initialize FontAwesome
import StatusBars from './components/StatusBars.tsx'
import VehicleHUD from './components/VehicleHUD.tsx'
import VehicleHUD2 from './components/VehicleHUD2.tsx'
import VehicleHUDStyle3 from './components/VehicleHUDStyle3.tsx'
import VehicleHUDStyle4 from './components/VehicleHUDStyle4.tsx'
import BoatHUD from './components/BoatHUD.tsx'
import BoatHUD2 from './components/BoatHUD2.tsx'
import BoatHUD3 from './components/BoatHUD3.tsx'
import FlightHUD from './components/FlightHUD.tsx'
import HelicopterHUD from './components/HelicopterHUD.tsx'
import VehicleMenu from './components/VehicleMenu.tsx'
import Location from './components/Location.tsx'
import PlayerInfo from './components/PlayerInfo.tsx'
import WeaponDisplay from './components/WeaponDisplay'
import EditMenu from './components/EditMenu.tsx'
import PositioningMode from './components/PositioningMode'
import SimplePositioningMode from './components/SimplePositioningMode'
import SoundController from './components/SoundController'
import NotificationContainer from './components/Notification'
import ProgressBar from './components/ProgressBar'
import NotificationProgressSettings from './components/NotificationProgressSettings'
import MusicPlayer from './components/MusicPlayer'
import ServerLogo from './components/ServerLogo'
import { HUDData, VehicleData, LocationData, PlayerInfo as PlayerInfoType, MoneyData, VoiceData, TimeData, WeaponData, HUDSettings } from './types'
import { getResponsivePosition, getPositionFromRight, getPositionFromBottom, getPositionFromBottomRight } from './utils/responsive'
import './App.css'

// Helper function to get the current resource name dynamically
const GetParentResourceName = (): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud' // Fallback for development
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

// Generate responsive default positions
const getDefaultUIPositions = () => {
  return {
    minimap: getResponsivePosition(20, 800),
    location: getResponsivePosition(20, 1020),
    weaponDisplay: getPositionFromBottomRight(250, 350),
    statusBars: getPositionFromBottom(20, 80),
    vehicleHud: getPositionFromBottomRight(240, 200),
    playerInfoContainer: getResponsivePosition(20, 20),
    healthIcon: getPositionFromBottom(30, 310),
    armorIcon: getPositionFromBottom(90, 310),
    hungerIcon: getPositionFromBottom(150, 310),
    thirstIcon: getPositionFromBottom(210, 310),
    oxygenIcon: getPositionFromBottom(270, 310),
    stressIcon: getPositionFromBottom(330, 310),
    // Miniature layout
    voiceCard_miniature: getPositionFromRight(160, 20),
    idCard_miniature: getPositionFromRight(120, 65),
    timeCard_miniature: getPositionFromRight(140, 100),
    jobCard_miniature: getPositionFromRight(170, 135),
    bankCard_miniature: getPositionFromRight(160, 170),
    cashCard_miniature: getPositionFromRight(160, 210),
    weaponDisplay_miniature: getPositionFromRight(200, 250),
    // Grid layout
    voiceCard_grid: getPositionFromRight(155, 20),
    idCard_grid: getPositionFromRight(155, 85),
    timeCard_grid: getPositionFromRight(155, 150),
    jobCard_grid: getPositionFromRight(198, 215),
    bankCard_grid: getPositionFromRight(198, 280),
    cashCard_grid: getPositionFromRight(155, 345),
    weaponDisplay_grid: getPositionFromRight(155, 410),
    // Modern layout
    voiceCard_modern: getPositionFromRight(220, 20),
    idCard_modern: getPositionFromRight(220, 95),
    timeCard_modern: getPositionFromRight(220, 170),
    jobCard_modern: getPositionFromRight(220, 245),
    bankCard_modern: getPositionFromRight(220, 320),
    cashCard_modern: getPositionFromRight(220, 395),
    weaponDisplay_modern: getPositionFromRight(220, 470)
  }
}

// Hardcoded default settings (copied from default-settings.json for first-time players)
const defaultSettings: HUDSettings = {
  health: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#ef4444', iconColor: '#ffffff', shadowColor: '#ef4444' },
  armor: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#3b82f6', iconColor: '#ffffff', shadowColor: '#3b82f6' },
  hunger: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#f59e0b', iconColor: '#ffffff', shadowColor: '#f59e0b' },
  thirst: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#06b6d4', iconColor: '#ffffff', shadowColor: '#06b6d4' },
  oxygen: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#00bcd4', iconColor: '#ffffff', shadowColor: '#00bcd4' },
  stress: { visible: true, visibleMin: 0, visibleMax: 100, bgColor: '#1a1a1a', progressColor: '#9c27b0', iconColor: '#ffffff', shadowColor: '#9c27b0' },
  style: 'progressOutline',
  borderRadius: 'fullyRounded',
  speedUnit: 'kmh',
  vehicleHudStyle: 'default',
  boatHudStyle: 'boat2',
  boatSpeedUnit: 'mph',
  flightHudStyle: 'flight1',
  flightSpeedUnit: 'knots',
  helicopterHudStyle: 'heli1',
  helicopterSpeedUnit: 'mph',
  flightHudEnabled: true,
  useVehicleHudForBoats: false,
  useVehicleHudForAircraft: false,
  useVehicleHudForHelicopters: false,
  serverLogoScale: 72,
  notification: {
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
  progressBar: {
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
  minimap: {
    size: 'small',
    shape: 'square',
    borderRadius: 12,
    position: { x: 20, y: 80 },
    minimapStyle: 'rounded',
    compassPrimaryColor: '#ffffff',
    compassBgColor: '#00000080',
    compassShadowColor: '#000000',
    compassBorderRadius: 'rounded',
    showMinimapOnFoot: true,
    showNorthBlip: true,
    moveCompassWhenHidden: true,
    compassFollowsCamera: true,
    showNearestPostal: false,
    showCompassStreet: true,
    showCompassDirection: true
  },
  playerInfo: {
    enabled: true,
    layoutStyle: 'miniature',
    cardStyle: 'rounded',
    themeMode: 'dark',
    bgColor: '#000000',
    iconBgColor: '#1a1a1a',
    contentBgColor: '#0a0a0a',
    transparency: 85,
    position: { x: 12, y: 12 },
    scale: 96,
    showId: true,
    showTime: true,
    showJob: true,
    showBank: true,
    showCash: true,
    showDirty: false,
    showVoice: true,
    showWeather: false,
    showServerInfo: false,
    serverName: 'Server Name',
    serverLogo: '',
    weatherIconType: 'fontawesome',
    weatherIconPath: '',
    showLogo: true,
    logoScale: 100,
    logoPosition: { x: 50, y: 10 },
    idColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    timeColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    jobColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    bankColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    cashColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    dirtyColors: { iconColor: '#ffffff', textColor: '#ffffff', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' },
    voiceColors: { iconColor: '#00ff00', textColor: '#00ff00', labelColor: '#999999', bgColor: '#0a0a0a', iconBgColor: '#1a1a1a' }
  },
  uiPositions: getDefaultUIPositions(),
  boatHUD1Colors: {
    fuelIconColor: '#ffa500',
    fuelArcColor: '#ffa500',
    fuelArcBgColor: 'rgba(255, 255, 255, 0.15)',
    engineIconColor: '#ffffff',
    engineArcColor: '#ffffff',
    engineArcBgColor: 'rgba(255, 255, 255, 0.15)',
    speedArcColor: '#ffffff',
    speedArcBgColor: 'rgba(255, 255, 255, 0.15)',
    speedNumberColor: '#ffffff',
    speedUnitColor: 'rgba(255, 255, 255, 0.7)',
    directionBgColor: 'rgba(255, 255, 255, 0.15)',
    directionTextColor: '#ffffff',
    statusBarBgColor: 'rgba(0, 0, 0, 0.9)',
    statusActiveColor: '#00ff00',
    statusInactiveColor: 'rgba(255, 255, 255, 0.2)'
  },
  boatHUD2Colors: {
    fuelIconColor: '#ffa500',
    fuelArcColor: '#ffa500',
    fuelArcBgColor: 'rgba(255, 255, 255, 0.15)',
    engineIconColor: '#ffffff',
    engineArcColor: '#ffffff',
    engineArcBgColor: 'rgba(255, 255, 255, 0.15)',
    speedArcColor: '#ffffff',
    speedArcBgColor: 'rgba(255, 255, 255, 0.15)',
    speedNumberColor: '#ffffff',
    speedUnitColor: 'rgba(255, 255, 255, 0.7)',
    directionBgColor: 'rgba(255, 255, 255, 0.1)',
    directionTextColor: '#ffffff',
    statusBarBgColor: 'rgba(0, 0, 0, 0.9)',
    statusActiveColor: '#00ff00',
    statusInactiveColor: 'rgba(255, 255, 255, 0.2)'
  }
}

function App() {
  const [visible, setVisible] = useState(true)
  const [editMenuOpen, setEditMenuOpen] = useState(false)
  const [positioningMode, setPositioningMode] = useState(false)
  const [hudSettings, setHudSettings] = useState<HUDSettings>(() => {
    const saved = localStorage.getItem('hudSettings')
    return saved ? JSON.parse(saved) : defaultSettings
  })
  const [hudData, setHudData] = useState<HUDData>({
    health: 100,
    armor: 0,
    hunger: 100,
    thirst: 100,
    stamina: 100,
    oxygen: 100,
    stress: 0,
    underwater: false
  })
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    inVehicle: false,
    speed: 0,
    fuel: 0,
    rpm: 0,
    gear: 0,
    engineHealth: 100
  })
  const [locationData, setLocationData] = useState<LocationData>({
    street: '',
    zone: ''
  })
  const [playerInfo, setPlayerInfo] = useState<PlayerInfoType>({
    serverId: 1,
    job: 'Unemployed'
  })
  const [money, setMoney] = useState<MoneyData>({
    cash: 0,
    bank: 0,
    dirty: 0
  })
  const [_voice, setVoice] = useState<VoiceData>({
    mode: 0,
    talking: false,
    radioChannel: 0,
    radioTalking: false
  })
  const [time, setTime] = useState<TimeData>({
    time: '00:00'
  })
  const [weapon, setWeapon] = useState<WeaponData>({
    hasWeapon: false,
    weaponName: '',
    weaponLabel: '',
    ammo: 0,
    maxAmmo: 0,
    isReloading: false
  })
  const [progressBar, setProgressBar] = useState({
    visible: false,
    label: '',
    duration: 5000,
    icon: 'mdi-timer-sand'
  })
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false)
  const [notificationProgressSettingsOpen, setNotificationProgressSettingsOpen] = useState(false)
  const [simplePositioningMode, setSimplePositioningMode] = useState(false)
  const [isDriver, setIsDriver] = useState(false)
  const [musicPlayerOpen, setMusicPlayerOpen] = useState(false)
  const [vehicleState, setVehicleState] = useState({
    engineOn: false,
    leftIndicator: false,
    rightIndicator: false,
    hazardLights: false,
    seatbelt: false,
    cruiseControl: false,
    interiorLight: false,
    headlights: 0,
    hood: false,
    trunk: false,
    doorsLocked: false,
    doors: {
      frontLeft: false,
      frontRight: false,
      rearLeft: false,
      rearRight: false
    },
    windows: {
      frontLeft: false,
      frontRight: false,
      rearLeft: false,
      rearRight: false
    }
  })

  // Expose updateHudSettings globally for child components to update state
  useEffect(() => {
    (window as any).updateHudSettings = (settings: HUDSettings) => {
      setHudSettings(settings)
      localStorage.setItem('hudSettings', JSON.stringify(settings))
    }
    return () => {
      delete (window as any).updateHudSettings
    }
  }, [])

  // Send minimap style to client on app load - CRITICAL FOR PERSISTENCE
  useEffect(() => {
    const sendMinimapStyle = () => {
      if (hudSettings.minimap && hudSettings.minimap.minimapStyle) {
        fetch(`https://${GetParentResourceName()}/setMinimapStyle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minimapStyle: hudSettings.minimap.minimapStyle })
        }).catch(() => {})
      }
    }
    
    // Send immediately
    sendMinimapStyle()
    
    // Also send after delays to ensure client receives it
    setTimeout(sendMinimapStyle, 100)
    setTimeout(sendMinimapStyle, 500)
    setTimeout(sendMinimapStyle, 1000)
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return
      
      const { action, data } = event.data

      switch (action) {
        case 'setVisible':
          if (data && typeof data.visible !== 'undefined') {
            setVisible(data.visible)
          }
          break
        case 'openEditMenu':
          setEditMenuOpen(true)
          break
        case 'loadSettings':
          if (data) {
            setHudSettings(data)
            localStorage.setItem('hudSettings', JSON.stringify(data))
          }
          break
        case 'updateHUD':
          if (data && data.data) {
            setHudData(data.data)
          }
          break
        case 'updateVehicle':
          if (data && data.data) {
            setVehicleData(data.data)
          }
          break
        case 'updateLocation':
          if (data && data.data) {
            setLocationData(data.data)
          }
          break
        case 'updatePlayerInfo':
          if (data && data.data) {
            setPlayerInfo(prev => ({ ...prev, ...data.data }))
          }
          break
        case 'updateMoney':
          if (data && data.data) {
            setMoney(prev => ({ ...prev, ...data.data }))
          }
          break
        case 'openVehicleMenu':
          if (data) {
            setVehicleMenuOpen(true)
            setIsDriver(data.isDriver || false)
            if (data.vehicleState) {
              setVehicleState(data.vehicleState)
            }
          }
          break
        case 'closeVehicleMenu':
          setVehicleMenuOpen(false)
          break
        case 'updateVehicleState':
          if (data) {
            setVehicleState(prev => ({ ...prev, ...data }))
          }
          break
        case 'updateVoice':
          if (data && data.data) {
            setVoice(data.data)
          }
          break
        case 'updateTime':
          if (data && data.data) {
            setTime(data.data)
          }
          break
        case 'updateWeapon':
          if (data && data.data) {
            setWeapon(data.data)
          }
          break
        case 'showProgressBar':
          if (data) {
            setProgressBar({
              visible: true,
              label: data.label || 'Processing...',
              duration: data.duration || 5000,
              icon: data.icon || 'mdi-timer-sand'
            })
          }
          break
        case 'hideProgressBar':
          setProgressBar(prev => ({ ...prev, visible: false }))
          break
        case 'openNotificationProgressSettings':
          setNotificationProgressSettingsOpen(true)
          break
        case 'openMusicPlayer':
          setMusicPlayerOpen(true)
          break
        case 'closeMusicPlayer':
          setMusicPlayerOpen(false)
          break
        case 'openPlayerInfoPositioning':
          setPositioningMode(true)
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Save settings to localStorage only (no server-side saving)
  const handleSaveSettings = (settings: HUDSettings) => {
    // Update React state immediately for instant feedback
    setHudSettings(settings)
    
    // Save to localStorage (persists in browser)
    localStorage.setItem('hudSettings', JSON.stringify(settings))
  }

  const handleCloseEditMenu = () => {
    setEditMenuOpen(false)
    fetch(`https://${GetParentResourceName()}/closeEditMenu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {})
  }

  const handleOpenPositioningMode = () => {
    setEditMenuOpen(false)
    setPositioningMode(true)
  }

  const handleResetPositions = () => {
    
    // Use hardcoded defaults from TSX (NOT from JSON file)
    const newSettings: HUDSettings = {
      ...defaultSettings,
      uiPositions: defaultSettings.uiPositions
    }
    
    // Save to localStorage
    handleSaveSettings(newSettings)
    localStorage.setItem('hudSettings', JSON.stringify(newSettings))
    
    // Reload the page to ensure clean state
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleClosePositioningMode = useCallback(() => {
    setPositioningMode(false)
    
    // Save to localStorage
    localStorage.setItem('hudSettings', JSON.stringify(hudSettings))
    
    // Close NUI focus
    fetch(`https://${GetParentResourceName()}/closePlayerInfoPositioning`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {})
  }, [hudSettings])

  const handleVehicleMenuAction = (action: string, data?: any) => {
    fetch(`https://${GetParentResourceName()}/vehicleAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, data })
    }).catch(() => {})
  }

  const handleCloseVehicleMenu = () => {
    setVehicleMenuOpen(false)
    fetch(`https://${GetParentResourceName()}/closeVehicleMenu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).catch(() => {})
  }

  // ESC key handler for positioning mode (only for old PositioningMode, not SimplePositioningMode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && positioningMode && !simplePositioningMode) {
        handleClosePositioningMode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [positioningMode, simplePositioningMode, handleClosePositioningMode])

  return (
    <>
      <NotificationContainer 
        position={hudSettings.notification?.position || 'bottom-left'}
        successColor={hudSettings.notification?.successColor || '#10b981'}
        errorColor={hudSettings.notification?.errorColor || '#ef4444'}
        infoColor={hudSettings.notification?.infoColor || '#3b82f6'}
        textColor={hudSettings.notification?.textColor || '#ffffff'}
        bgColor={hudSettings.notification?.bgColor || '#141419'}
        transparency={hudSettings.notification?.transparency || 85}
      />
      <ProgressBar
        isVisible={progressBar.visible}
        label={progressBar.label}
        duration={progressBar.duration}
        icon={progressBar.icon}
        position={hudSettings.progressBar?.position || 'bottom-center'}
        textColor={hudSettings.progressBar?.textColor || '#ffffff'}
        percentageColor={hudSettings.progressBar?.percentageColor || '#ffffff'}
        iconColor={hudSettings.progressBar?.iconColor || '#3b82f6'}
        barColor={hudSettings.progressBar?.defaultColor || '#3b82f6'}
        bgColor={hudSettings.progressBar?.bgColor || '#000000'}
        transparency={hudSettings.progressBar?.transparency || 65}
        onComplete={() => setProgressBar(prev => ({ ...prev, visible: false }))}
      />
      {visible && (
        <div className="hud-container">
          {positioningMode && (
            <div style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(59, 130, 246, 0.95)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 99999,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              pointerEvents: 'none'
            }}>
              🎯 POSITIONING MODE - Drag cards to move | Press ESC to save
            </div>
          )}
          <ServerLogo positioningMode={positioningMode} hudSettings={hudSettings} />
          <PlayerInfo 
            playerInfo={playerInfo} 
            money={money} 
            time={time}
            voice={_voice}
            settings={hudSettings.playerInfo}
            positioningMode={positioningMode}
            hudSettings={hudSettings}
          />
          <Location data={locationData} settings={hudSettings} positioningMode={positioningMode} />
          <div className="minimap"></div>
          <StatusBars 
            data={hudData} 
            settings={hudSettings}
            positioningMode={positioningMode}
          />
          {vehicleData.inVehicle && hudSettings.vehicleHudStyle === 'default' && (!vehicleData.isBoat || hudSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || hudSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || hudSettings.useVehicleHudForHelicopters)) && (
            <VehicleHUD data={vehicleData} speedUnit={hudSettings.speedUnit || 'kmh'} />
          )}
          {vehicleData.inVehicle && hudSettings.vehicleHudStyle === 'circular' && (!vehicleData.isBoat || hudSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || hudSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || hudSettings.useVehicleHudForHelicopters)) && (
            <VehicleHUD2
              speed={vehicleData.speed}
              maxSpeed={200}
              rpm={vehicleData.rpm}
              gear={vehicleData.gear}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              seatbelt={vehicleData.seatbelt || false}
              lights={vehicleData.lights || false}
              doors={vehicleData.doorOpen || false}
              engine={vehicleData.engineOn || false}
              speedUnit={hudSettings.speedUnit || 'kmh'}
            />
          )}
          {vehicleData.inVehicle && hudSettings.vehicleHudStyle === 'style3' && (!vehicleData.isBoat || hudSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || hudSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || hudSettings.useVehicleHudForHelicopters)) && (
            <VehicleHUDStyle3
              speed={vehicleData.speed}
              rpm={vehicleData.rpm}
              gear={vehicleData.gear}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              seatbelt={vehicleData.seatbelt || false}
              lights={vehicleData.lights || false}
              highbeams={vehicleData.highbeams || false}
              doors={vehicleData.doorOpen || false}
              leftSignal={vehicleData.indicators?.left || false}
              rightSignal={vehicleData.indicators?.right || false}
              speedUnit={hudSettings.speedUnit || 'kmh'}
            />
          )}
          {vehicleData.inVehicle && hudSettings.vehicleHudStyle === 'style4' && (!vehicleData.isBoat || hudSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || hudSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || hudSettings.useVehicleHudForHelicopters)) && (
            <VehicleHUDStyle4
              speed={vehicleData.speed}
              rpm={vehicleData.rpm}
              gear={vehicleData.gear}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              seatbelt={vehicleData.seatbelt || false}
              lights={vehicleData.lights || false}
              highbeams={vehicleData.highbeams || false}
              doors={vehicleData.doorOpen || false}
              leftSignal={vehicleData.indicators?.left || false}
              rightSignal={vehicleData.indicators?.right || false}
              speedUnit={hudSettings.speedUnit || 'kmh'}
            />
          )}
          {vehicleData.inVehicle && vehicleData.isBoat && !hudSettings.useVehicleHudForBoats && hudSettings.boatHudStyle === 'boat1' && (
            <BoatHUD
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              direction={locationData.direction || 'N'}
              speedUnit={hudSettings.boatSpeedUnit || 'mph'}
            />
          )}
          {vehicleData.inVehicle && vehicleData.isBoat && !hudSettings.useVehicleHudForBoats && hudSettings.boatHudStyle === 'boat2' && (
            <BoatHUD2
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              gear={vehicleData.gear}
              speedUnit={hudSettings.boatSpeedUnit || 'mph'}
            />
          )}
          {vehicleData.inVehicle && vehicleData.isBoat && !hudSettings.useVehicleHudForBoats && hudSettings.boatHudStyle === 'boat3' && (
            <BoatHUD3
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              speedUnit={hudSettings.boatSpeedUnit || 'mph'}
              waveHeight={vehicleData.waveHeight || 0}
              waterDepth={vehicleData.waterDepth || 0}
              compassHeading={vehicleData.compassHeading || 0}
            />
          )}
          {vehicleData.inVehicle && vehicleData.isPlane && !hudSettings.useVehicleHudForAircraft && hudSettings.flightHudStyle === 'flight1' && (
            <FlightHUD
              pitch={vehicleData.pitch || 0}
              roll={vehicleData.roll || 0}
              altitude={vehicleData.altitude || 0}
              heading={vehicleData.heading || 0}
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineOn={vehicleData.engineOn || false}
              lights={vehicleData.lights || false}
              gearDown={vehicleData.gearDown || false}
              speedUnit={hudSettings.flightSpeedUnit || 'mph'}
            />
          )}
          {/* Helicopter HUD - Shows when in helicopter and not using vehicle HUD */}
          {vehicleData.inVehicle && vehicleData.isHelicopter && !hudSettings.useVehicleHudForHelicopters && (
            <HelicopterHUD
              pitch={vehicleData.pitch || 0}
              roll={vehicleData.roll || 0}
              altitude={vehicleData.altitude || 0}
              heading={vehicleData.heading || 0}
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineOn={vehicleData.engineOn || false}
              lights={vehicleData.lights || false}
              speedUnit={hudSettings.helicopterSpeedUnit || 'mph'}
            />
          )}

          {(weapon.hasWeapon || positioningMode) && (
            <WeaponDisplay 
              weapon={weapon}
              settings={hudSettings.playerInfo}
              position={hudSettings.uiPositions?.weaponDisplay}
              positioningMode={positioningMode}
              hudSettings={hudSettings}
            />
          )}

          {/* Sound Controller */}
          <SoundController
            seatbelt={vehicleData.seatbelt || false}
            inVehicle={vehicleData.inVehicle}
            speed={vehicleData.speed}
            indicators={vehicleData.indicators}
            isStalling={vehicleData.isPlane && (vehicleData.altitude || 0) > 200 && vehicleData.speed * 0.539957 < 60}
            seatbeltSoundsEnabled={hudSettings.seatbeltSoundsEnabled ?? true}
          />
        </div>
      )}
      <VehicleMenu
        isOpen={vehicleMenuOpen}
        isDriver={isDriver}
        vehicleState={vehicleState}
        onClose={handleCloseVehicleMenu}
        onAction={handleVehicleMenuAction}
      />
      <EditMenu 
        isOpen={editMenuOpen} 
        onClose={handleCloseEditMenu}
        settings={hudSettings}
        onSave={handleSaveSettings}
        onOpenPositioningMode={handleOpenPositioningMode}
        onResetPositions={handleResetPositions}
      />
      <NotificationProgressSettings
        isOpen={notificationProgressSettingsOpen}
        settings={hudSettings}
        onSave={handleSaveSettings}
        onClose={() => {
          setNotificationProgressSettingsOpen(false)
          fetch(`https://${GetParentResourceName()}/closeEditMenu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => {})
        }}
      />
      <PositioningMode
        isActive={positioningMode}
        currentPositions={hudSettings.uiPositions || defaultSettings.uiPositions!}
        onSave={(positions) => {
          const newSettings = {
            ...hudSettings,
            uiPositions: positions
          }
          handleSaveSettings(newSettings)
          setPositioningMode(false)
          // Close NUI focus
          fetch(`https://${GetParentResourceName()}/closeEditMenu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => {})
        }}
        onCancel={() => setPositioningMode(false)}
      />
      <SimplePositioningMode
        isActive={simplePositioningMode}
        settings={hudSettings}
        hudData={hudData}
        playerInfo={playerInfo}
        money={money}
        weapon={weapon}
        onSave={handleSaveSettings}
        onClose={() => {
          setSimplePositioningMode(false)
          fetch(`https://${GetParentResourceName()}/closeEditMenu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => {})
        }}
      />
      <MusicPlayer
        isOpen={musicPlayerOpen}
        onClose={() => {
          setMusicPlayerOpen(false)
          fetch(`https://${GetParentResourceName()}/closeMusicPlayer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          }).catch(() => {})
        }}
      />
    </>
  )
}

export default App
