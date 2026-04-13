export interface HUDData {
  health: number
  armor: number
  hunger: number
  thirst: number
  stamina: number
  oxygen: number
  stress: number
  underwater: boolean
  showOxygen?: boolean // Flag to control oxygen bar visibility (stamina + underwater)
}

export interface MinimapSettings {
  size: 'small' | 'medium'
  shape: 'square' | 'circle' | 'rounded'
  borderRadius: number
  position: { x: number; y: number }
  // Minimap options
  showMinimapOnFoot?: boolean
  showNorthBlip?: boolean
  moveCompassWhenHidden?: boolean
  minimapStyle?: 'square' | 'circular' | 'rounded'
  // Compass options
  showCompassOnFoot?: boolean
  compassFollowsCamera?: boolean
  showNearestPostal?: boolean
  compassStyle?: 'minimal' | 'detailed'
  compassBorderRadius?: 'square' | 'circle' | 'rounded'
  compassPrimaryColor?: string
  compassBgColor?: string
  compassShadowColor?: string
  showCompassStreet?: boolean
  showCompassDirection?: boolean
}

export interface PlayerInfoElementColors {
  iconColor: string
  textColor: string
  labelColor: string
  bgColor: string
  iconBgColor?: string // Optional icon background color for MOV HUD
}

export interface PlayerInfoSettings {
  enabled: boolean
  layoutStyle: 'miniature' | 'grid' | 'modern' // Layout style options (miniature, grid, Modern HUD)
  cardStyle: 'rounded' | 'square' | 'angled' | 'hexagon'
  themeMode: 'light' | 'dark'
  bgColor: string
  iconBgColor: string
  contentBgColor: string
  transparency: number
  position: { x: number; y: number } // Position for dragging
  scale: number // Card scale (70-130, default 100)
  showId: boolean
  showTime: boolean
  showJob: boolean
  showBank: boolean
  showCash: boolean
  showDirty: boolean
  showVoice: boolean
  showWeather: boolean
  showServerInfo: boolean
  serverName: string
  serverLogo: string
  weatherIconType: 'fontawesome' | 'png' // Weather icon type
  weatherIconPath: string // Path to custom PNG icon
  // Server Logo Settings
  showLogo: boolean // Toggle logo visibility
  logoScale: number // Logo scale (50-200, default 100)
  logoPosition: { x: number; y: number } // Logo position (default top center)
  // Per-element colors
  idColors: PlayerInfoElementColors
  timeColors: PlayerInfoElementColors
  jobColors: PlayerInfoElementColors
  bankColors: PlayerInfoElementColors
  cashColors: PlayerInfoElementColors
  dirtyColors: PlayerInfoElementColors
  voiceColors: PlayerInfoElementColors
}

export interface BoatHUDColors {
  fuelIconColor: string
  fuelArcColor: string
  fuelArcBgColor: string
  engineIconColor: string
  engineArcColor: string
  engineArcBgColor: string
  speedArcColor: string
  speedArcBgColor: string
  speedNumberColor: string
  speedUnitColor: string
  directionBgColor: string
  directionTextColor: string
  statusBarBgColor: string
  statusActiveColor: string
  statusInactiveColor: string
}

export interface NotificationSettings {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center-left' | 'center-right'
  style: 'style1' // Only one style
  successColor: string
  errorColor: string
  warningColor: string
  infoColor: string
  bgColor: string
  textColor: string
  timerColor: string
  transparency: number // 0-100
}

export interface ProgressBarSettings {
  position: 'bottom-center' | 'top-center' | 'bottom-left' | 'bottom-right'
  style: 'style1' // Only one style
  defaultColor: string
  bgColor: string
  textColor: string
  timerColor: string
  percentageColor: string
  iconColor: string
  transparency: number // 0-100
}

export interface ElementPosition {
  x: number
  y: number
  width?: number
  height?: number
}

export interface UIPositions {
  // Core HUD elements
  minimap: ElementPosition
  location: ElementPosition
  weaponDisplay: ElementPosition
  statusBars: ElementPosition
  vehicleHud: ElementPosition
  
  // Individual status bar icons
  healthIcon: ElementPosition
  armorIcon: ElementPosition
  hungerIcon: ElementPosition
  thirstIcon: ElementPosition
  oxygenIcon: ElementPosition
  stressIcon: ElementPosition
  
  // Player info cards - individual positions for each card
  playerInfoContainer: ElementPosition
  playerInfoId?: ElementPosition
  playerInfoTime?: ElementPosition
  playerInfoJob?: ElementPosition
  playerInfoBank?: ElementPosition
  playerInfoCash?: ElementPosition
  playerInfoDirty?: ElementPosition
  
  // Allow dynamic keys for layout-specific positions (e.g., timeCard_miniature, jobCard_grid)
  [key: string]: ElementPosition | undefined
}

export interface HUDSettings {
  health: StatusBarSettings
  armor: StatusBarSettings
  hunger: StatusBarSettings
  thirst: StatusBarSettings
  oxygen: StatusBarSettings
  stress: StatusBarSettings
  style: 'progressOutline' | 'progressFill' | 'percentages' | 'progressBar'
  borderRadius: 'fullyRounded' | 'slightlyRounded' | 'square'
  minimap: MinimapSettings
  playerInfo?: PlayerInfoSettings
  notification?: NotificationSettings
  progressBar?: ProgressBarSettings
  uiPositions?: UIPositions
  speedUnit?: 'kmh' | 'mph'
  vehicleHudStyle?: 'default' | 'circular' | 'style3' | 'style4'
  boatHudStyle?: 'boat1' | 'boat2' | 'boat3'
  useVehicleHudForBoats?: boolean
  boatSpeedUnit?: 'kmh' | 'mph'
  boatHUD1Colors?: BoatHUDColors
  boatHUD2Colors?: BoatHUDColors
  flightHudStyle?: 'flight1'
  helicopterHudStyle?: 'heli1'
  useVehicleHudForAircraft?: boolean
  useVehicleHudForHelicopters?: boolean
  flightSpeedUnit?: 'kmh' | 'mph' | 'knots'
  helicopterSpeedUnit?: 'kmh' | 'mph' | 'knots'
  flightHudEnabled?: boolean
  serverLogoScale?: number // Server logo scale (50-200, default 100)
  resolution?: string // e.g., "1920x1080"
  layout?: Record<string, LayoutElement> // For JSON import/export
  seatbeltSoundsEnabled?: boolean // Enable/disable all seatbelt sounds (on/off/alarm)
}

export interface LayoutElement {
  dimensions: {
    height: number
    width: number
  }
  offset: {
    x: number
    y: number
    bottom?: number
    top?: number
    left?: number
    right?: number
    offsetX?: number
    offsetY?: number
    centerDx?: number
    centerDy?: number
  }
  hidden?: boolean
}

export interface StatusBarSettings {
  visible: boolean
  visibleMin: number
  visibleMax: number
  bgColor: string
  progressColor: string
  iconColor: string
  shadowColor: string
}

export interface VehicleData {
  inVehicle: boolean
  speed: number
  maxSpeed?: number
  fuel: number
  rpm: number
  gear: number
  engineHealth: number
  odometer?: number
  seatbelt?: boolean
  engineOn?: boolean
  lights?: boolean
  highbeams?: boolean
  doorOpen?: boolean
  indicators?: {
    left: boolean
    right: boolean
    hazard: boolean
  }
  isBoat?: boolean
  anchor?: boolean
  waveHeight?: number
  waterDepth?: number
  distanceTraveled?: number
  compassHeading?: number
  isAircraft?: boolean
  isHelicopter?: boolean
  isPlane?: boolean
  altitude?: number
  heading?: number
  pitch?: number
  roll?: number
  verticalSpeed?: number
  gearDown?: boolean
}

export interface LocationData {
  street: string
  zone: string
  direction?: string
}

export interface PlayerInfo {
  serverId: number
  job: string
}

export interface MoneyData {
  cash: number
  bank: number
  dirty: number
}

export interface VoiceData {
  mode: number // 0=muted, 1=whisper, 2=normal, 3=shout
  talking: boolean
  radioChannel?: number // Radio frequency (e.g., 7 for 7MHz)
  radioTalking?: boolean // True if talking on radio
}

export interface TimeData {
  time: string
}

export interface WeaponData {
  hasWeapon: boolean
  weaponName: string // e.g., "WEAPON_ASSAULTRIFLE"
  weaponLabel: string // e.g., "Assault Rifle"
  ammo: number
  maxAmmo: number
  isReloading: boolean
}

export interface WeaponSettings {
  enabled: boolean
  position: { x: number; y: number }
  bgColor: string
  iconBgColor: string
  textColor: string
  labelColor: string
  transparency: number
}
