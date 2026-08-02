import { useState, useEffect } from 'react'
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
import { HUDData, VehicleData, LocationData, PlayerInfo as PlayerInfoType, MoneyData, VoiceData, TimeData, WeaponData, HUDSettings, HudConfig, VehicleHudVisibility } from './types'
import { DEFAULT_LAYOUT, cloneLayout, migrateUiPositions, readViewport } from './utils/layout'
import './App.css'

// Helper function to get the current resource name dynamically
const GetParentResourceName = (): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud' // Fallback for development
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

/* Default positions now live in utils/layout.ts as static design-space records.
   The old getDefaultUIPositions() read window.innerWidth/innerHeight at MODULE
   SCOPE, so the whole table was frozen to whatever viewport existed when the
   page first loaded and was never recomputed - not even by "Reset positions".
   DEFAULT_LAYOUT touches no window API and resolves per-render instead. */

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
  uiPositions: cloneLayout(DEFAULT_LAYOUT) as any,
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
  // config.lua payload - null until the client answers. Server config always
  // overrides whatever the player saved in localStorage.
  const [hudConfig, setHudConfig] = useState<HudConfig | null>(null)
  const [editMenuOpen, setEditMenuOpen] = useState(false)
  const [positioningMode, setPositioningMode] = useState(false)
  const [minimapAnchor, setMinimapAnchor] = useState<{x:number; y:number; width:number; height:number}|null>(null)
  const [hudSettings, setHudSettings] = useState<HUDSettings>(() => {
    const saved = localStorage.getItem('hudSettings')
    let parsed: HUDSettings

    try {
      parsed = saved ? JSON.parse(saved) : defaultSettings
    } catch {
      parsed = defaultSettings
    }

    // Convert legacy raw-pixel positions into resolution-independent records.
    // Idempotent, and an exact identity when the data was authored on the
    // resolution the player is currently running.
    const migrated = migrateUiPositions(parsed as any, readViewport()) as HUDSettings

    if (migrated !== parsed) {
      try {
        localStorage.setItem('hudSettings', JSON.stringify(migrated))
      } catch {
        /* storage full or blocked - the in-memory copy is still correct */
      }
    }

    return migrated
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

  // Expose updateHudSettings globally for child components to update state.
  // Always reads the latest localStorage before merging so stale prop closures
  // in PlayerInfoCard / StatusBarCard never clobber each other's saved positions.
  useEffect(() => {
    (window as any).updateHudSettings = (settings: HUDSettings) => {
      const raw = localStorage.getItem('hudSettings')
      const latest: HUDSettings = raw ? JSON.parse(raw) : settings
      // Incoming `settings` wins for top-level fields (e.g. playerInfo.scale for
      // resize); uiPositions is deep-merged so concurrent card drags can't clobber
      // each other's saved positions in localStorage.
      const merged: HUDSettings = {
        ...latest,
        ...settings,
        uiPositions: {
          ...(latest.uiPositions || {}),
          ...(settings.uiPositions || {})
        } as HUDSettings['uiPositions']
      }
      setHudSettings(merged)
      localStorage.setItem('hudSettings', JSON.stringify(merged))
    }
    return () => {
      delete (window as any).updateHudSettings
    }
  }, [])

  /* The old pixel-based vehicleHud "TWEAKS" block lived here. It is gone:
     positions are now design-space records, and that block clamped the value
     and wrote the clamped result back, permanently destroying the author's
     layout for anyone who ever loaded the HUD on a small screen. */

  // Ask the client for config.lua as soon as the UI mounts. The client also
  // pushes it on resource start / spawn, but the UI may not exist yet then.
  useEffect(() => {
    let cancelled = false

    const requestConfig = () => {
      fetch(`https://${GetParentResourceName()}/requestConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
        .then(res => res.json())
        .then(cfg => {
          if (!cancelled && cfg && cfg.hud) setHudConfig(cfg as HudConfig)
        })
        .catch(() => {})
    }

    requestConfig()
    const retry = setTimeout(requestConfig, 2000)

    return () => {
      cancelled = true
      clearTimeout(retry)
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
        case 'setConfig':
          if (data) {
            setHudConfig(data as HudConfig)
          }
          break
        case 'setVisible':
          if (data && typeof data.visible !== 'undefined') {
            setVisible(data.visible)
          }
          break
        case 'openEditMenu':
          setEditMenuOpen(true)
          if (data?.minimapAnchor) setMinimapAnchor(data.minimapAnchor)
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
          if (data?.minimapAnchor) setMinimapAnchor(data.minimapAnchor)
          break
        case 'openSimplePositioning':
          setSimplePositioningMode(true)
          if (data?.minimapAnchor) setMinimapAnchor(data.minimapAnchor)
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
      uiPositions: cloneLayout(DEFAULT_LAYOUT) as any
    }
    
    // Save to localStorage
    handleSaveSettings(newSettings)
    localStorage.setItem('hudSettings', JSON.stringify(newSettings))
    
    // Reload the page to ensure clean state
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

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

  // NOTE: ESC for PositioningMode is handled inside PositioningMode itself via onSave callback

  // ============================================================
  // CONFIG ENFORCEMENT
  // config.lua can only ever REMOVE things a player enabled locally -
  // a bar/card disabled server-side can never be re-enabled from the edit menu.
  // ============================================================
  const gateBar = (bar: HUDSettings['health'], allowed?: boolean) =>
    allowed === false ? { ...bar, visible: false } : bar

  const effectiveSettings: HUDSettings = hudConfig
    ? {
        ...hudSettings,
        health: gateBar(hudSettings.health, hudConfig.statusBars.health),
        armor: gateBar(hudSettings.armor, hudConfig.statusBars.armor),
        hunger: gateBar(hudSettings.hunger, hudConfig.statusBars.hunger),
        thirst: gateBar(hudSettings.thirst, hudConfig.statusBars.thirst),
        oxygen: gateBar(hudSettings.oxygen, hudConfig.statusBars.oxygen),
        stress: gateBar(hudSettings.stress, hudConfig.statusBars.stress),
        speedUnit: hudSettings.speedUnit || hudConfig.format.speedUnit,
        boatSpeedUnit: hudSettings.boatSpeedUnit || hudConfig.format.speedUnit,
        playerInfo: hudSettings.playerInfo
          ? {
              ...hudSettings.playerInfo,
              showId: hudSettings.playerInfo.showId && hudConfig.components.serverId,
              showTime: hudSettings.playerInfo.showTime && hudConfig.components.time,
              showJob: hudSettings.playerInfo.showJob && hudConfig.components.job,
              showBank: hudSettings.playerInfo.showBank && hudConfig.components.bankBalance,
              showCash: hudSettings.playerInfo.showCash && hudConfig.components.cashBalance,
              showDirty: hudSettings.playerInfo.showDirty && hudConfig.components.dirtyMoneyBalance,
              showVoice: hudSettings.playerInfo.showVoice && hudConfig.components.voiceOrRadio,
              showLogo: hudSettings.playerInfo.showLogo && hudConfig.components.serverLogo
            }
          : hudSettings.playerInfo
      }
    : hudSettings

  // Per-element vehicle HUD toggles from Config.VehicleHUD
  const vehicleHudShow: VehicleHudVisibility = {
    showSpeed: hudConfig?.vehicleHud.showSpeed ?? true,
    showFuel: hudConfig?.vehicleHud.showFuel ?? true,
    showRPM: hudConfig?.vehicleHud.showRPM ?? true,
    showGear: hudConfig?.vehicleHud.showGear ?? true,
    showDamage: hudConfig?.vehicleHud.showDamage ?? true,
    showDoorWarning: hudConfig?.vehicleHud.showDoorWarning ?? true,
    showSeatbeltWarning: hudConfig?.vehicleHud.showSeatbeltWarning ?? true,
    showEngineWarning: hudConfig?.vehicleHud.showEngineWarning ?? true
  }

  // Config.VehicleHUD.enabled = false kills every in-vehicle gauge
  const vehicleHudEnabled = hudConfig?.vehicleHud.enabled !== false
  const showVehicleHud = vehicleData.inVehicle && vehicleHudEnabled

  // Config.ShowComponents.weapon
  const weaponAllowed = hudConfig?.components.weapon !== false

  // Config.Currency / Config.NumberFormat
  const currency = hudConfig?.format.currency ?? '$'
  const numberFormat = hudConfig?.format.numberFormat ?? 'en-US'

  // Config.DistanceMeasurement (boat depth / wave readouts)
  const distanceUnit = hudConfig?.format.distanceUnit ?? 'meters'

  return (
    <>
      <NotificationContainer
        position={hudSettings.notification?.position || 'bottom-left'}
        successColor={hudSettings.notification?.successColor || '#10b981'}
        errorColor={hudSettings.notification?.errorColor || '#ef4444'}
        warningColor={hudSettings.notification?.warningColor || '#f59e0b'}
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
            <div className="positioning-banner">
              <span className="positioning-banner-dot" />
              POSITIONING MODE
              <span className="positioning-banner-sep">/</span>
              DRAG TO MOVE
              <span className="positioning-banner-sep">/</span>
              ESC TO SAVE
            </div>
          )}
          <ServerLogo positioningMode={positioningMode && (hudConfig?.permissions.editLogo !== false)} hudSettings={effectiveSettings} />
          <PlayerInfo
            playerInfo={playerInfo}
            money={money}
            time={time}
            voice={_voice}
            settings={effectiveSettings.playerInfo}
            positioningMode={positioningMode}
            hudSettings={effectiveSettings}
            currency={currency}
            numberFormat={numberFormat}
            showVoiceWaveAnimation={hudConfig?.voice.showWaveAnimation !== false}
          />
          <Location
            data={locationData}
            settings={effectiveSettings}
            positioningMode={positioningMode}
            moveCompassWhenHidden={hudConfig?.minimap.moveCompassWhenHidden !== false}
            minimapHeight={hudConfig?.minimap.size ?? 180}
          />
          <div className="minimap"></div>
          <StatusBars
            data={hudData}
            settings={effectiveSettings}
            positioningMode={positioningMode}
          />
          {showVehicleHud && effectiveSettings.vehicleHudStyle === 'default' && (!vehicleData.isBoat || effectiveSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || effectiveSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || effectiveSettings.useVehicleHudForHelicopters)) && (
            <VehicleHUD
              data={vehicleData}
              speedUnit={effectiveSettings.speedUnit || 'kmh'}
              show={vehicleHudShow}
              positioningMode={positioningMode}
              hudSettings={effectiveSettings}
            />
          )}
          {showVehicleHud && effectiveSettings.vehicleHudStyle === 'circular' && (!vehicleData.isBoat || effectiveSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || effectiveSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || effectiveSettings.useVehicleHudForHelicopters)) && (
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
              speedUnit={effectiveSettings.speedUnit || 'kmh'}
              show={vehicleHudShow}
            />
          )}
          {showVehicleHud && effectiveSettings.vehicleHudStyle === 'style3' && (!vehicleData.isBoat || effectiveSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || effectiveSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || effectiveSettings.useVehicleHudForHelicopters)) && (
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
              speedUnit={effectiveSettings.speedUnit || 'kmh'}
              show={vehicleHudShow}
            />
          )}
          {showVehicleHud && effectiveSettings.vehicleHudStyle === 'style4' && (!vehicleData.isBoat || effectiveSettings.useVehicleHudForBoats) && ((!vehicleData.isPlane || effectiveSettings.useVehicleHudForAircraft) && (!vehicleData.isHelicopter || effectiveSettings.useVehicleHudForHelicopters)) && (
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
              speedUnit={effectiveSettings.speedUnit || 'kmh'}
              show={vehicleHudShow}
            />
          )}
          {showVehicleHud && vehicleData.isBoat && !effectiveSettings.useVehicleHudForBoats && effectiveSettings.boatHudStyle === 'boat1' && (
            <BoatHUD
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              direction={locationData.direction || 'N'}
              speedUnit={effectiveSettings.boatSpeedUnit || 'mph'}
            />
          )}
          {showVehicleHud && vehicleData.isBoat && !effectiveSettings.useVehicleHudForBoats && effectiveSettings.boatHudStyle === 'boat2' && (
            <BoatHUD2
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              gear={vehicleData.gear}
              speedUnit={effectiveSettings.boatSpeedUnit || 'mph'}
            />
          )}
          {showVehicleHud && vehicleData.isBoat && !effectiveSettings.useVehicleHudForBoats && effectiveSettings.boatHudStyle === 'boat3' && (
            <BoatHUD3
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineHealth={vehicleData.engineHealth}
              anchor={vehicleData.anchor || false}
              lights={vehicleData.lights || false}
              engineOn={vehicleData.engineOn || false}
              speedUnit={effectiveSettings.boatSpeedUnit || 'mph'}
              waveHeight={vehicleData.waveHeight || 0}
              waterDepth={vehicleData.waterDepth || 0}
              compassHeading={vehicleData.compassHeading || 0}
              distanceUnit={distanceUnit}
            />
          )}
          {showVehicleHud && vehicleData.isPlane && !effectiveSettings.useVehicleHudForAircraft && effectiveSettings.flightHudEnabled !== false && effectiveSettings.flightHudStyle === 'flight1' && (
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
              speedUnit={effectiveSettings.flightSpeedUnit || 'mph'}
            />
          )}
          {/* Helicopter HUD - Shows when in helicopter and not using vehicle HUD */}
          {showVehicleHud && vehicleData.isHelicopter && !effectiveSettings.useVehicleHudForHelicopters && effectiveSettings.flightHudEnabled !== false && (
            <HelicopterHUD
              pitch={vehicleData.pitch || 0}
              roll={vehicleData.roll || 0}
              altitude={vehicleData.altitude || 0}
              heading={vehicleData.heading || 0}
              speed={vehicleData.speed}
              fuel={vehicleData.fuel}
              engineOn={vehicleData.engineOn || false}
              lights={vehicleData.lights || false}
              speedUnit={effectiveSettings.helicopterSpeedUnit || 'mph'}
            />
          )}

          {weaponAllowed && (weapon.hasWeapon || positioningMode) && (
            <WeaponDisplay
              weapon={weapon}
              settings={effectiveSettings.playerInfo}
              position={effectiveSettings.uiPositions?.weaponDisplay}
              positioningMode={positioningMode}
              hudSettings={effectiveSettings}
            />
          )}

          {/* Sound Controller */}
          <SoundController
            seatbelt={vehicleData.seatbelt || false}
            inVehicle={vehicleData.inVehicle}
            speed={vehicleData.speed}
            indicators={vehicleData.indicators}
            isStalling={vehicleData.isPlane && (vehicleData.altitude || 0) > 200 && vehicleData.speed * 0.539957 < 60}
            seatbeltSoundsEnabled={(hudConfig?.seatbelt.enabled !== false) && (hudSettings.seatbeltSoundsEnabled ?? true)}
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
        minimapAnchor={minimapAnchor}
        currentPositions={hudSettings.uiPositions || defaultSettings.uiPositions!}
        onSave={(positions) => {
          const newSettings = {
            ...hudSettings,
            uiPositions: {
              ...(hudSettings.uiPositions || {}),
              ...positions
            }
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
        minimapAnchor={minimapAnchor}
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
