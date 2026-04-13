Config = {}

-- ============================================
-- FRAMEWORK & INTEGRATION
-- ============================================

-- Framework Detection (auto-detects ESX, QBCore, QBox, or runs standalone)
Config.Framework = "auto" -- Options: "auto", "ESX", "QBCore", "QBox", "standalone"
-- auto = automatically detects which framework is running
-- standalone = no framework, basic HUD only

-- Fuel System Integration
Config.FuelSystem = "native" -- Supported: "native" (default GTA V fuel), "ox_fuel", "LegacyFuel", "lc_fuel", "ps-fuel", "lj-fuel", "cdn-fuel", "hyon_gas_station", "okokGasStation", "nd_fuel", "myFuel", "ti_fuel", "Renewed-Fuel", "rcore_fuel", "none"
-- "native" = Uses GTA V's built-in fuel system (GetVehicleFuelLevel) - Works per vehicle automatically
-- "none" = Always shows 100% fuel (no fuel system)

-- ============================================
-- LOCALE & FORMATTING
-- ============================================

Config.Locale = "en"
Config.Currency = "$"
Config.NumberFormat = "en-US" -- follows [language]-[country code]

-- ============================================
-- MEASUREMENTS
-- ============================================

Config.SpeedMeasurement = "kmh" -- "kmh" or "mph" (can be changed in HUD settings)
Config.DistanceMeasurement = "meters" -- "meters" or "feet"

-- ============================================
-- COMMANDS (Registered in client/main.lua)
-- ============================================

-- Main Commands
Config.OpenSettingsCommand = "hudedit" -- Line 1271: Opens HUD edit menu (includes all settings: health, vehicle, boat, flight, minimap, playerinfo, notifications, progressbar, import/export)
Config.ToggleHudCommand = "hud" -- Line 968: Toggles HUD visibility (cinematic mode - hides everything including minimap)

-- Additional Commands (hardcoded in client)
-- "hudsettings" - Opens HUD settings menu (line 1261) - same as hudedit
-- "playerinfoedit" / "piedit" - Opens player info positioning (line 1282, 1293)
-- "minimapstyle" - Changes minimap style (line 1192)
-- "toggleminimap" - Toggles minimap visibility (line 1206)

-- ============================================
-- KEYBINDS (Registered in client/main.lua)
-- ============================================

-- Vehicle Controls
Config.VehicleControlKeybind = "F4" -- Line 1915: Vehicle menu (windows, doors, seats, engine)
Config.AllowPassengersToUseVehicleControl = true -- Passengers can only toggle their own window/door or change seats

-- Seatbelt Settings 
Config.Seatbelt = {
    enabled = true, -- Seatbelt system enabled
    key = 'B', -- Line 317: RegisterKeyMapping('seatbelt', 'Toggle Seatbelt', 'keyboard', 'B')
    ejectSpeed = 90, -- Speed (MPH) at which player is ejected without seatbelt
    ejectOnImpact = true 
}


-- Boat Controls 
Config.BoatAnchorKeybind = "J" -- Boat anchor toggle (handled in vehicle menu F4)

-- Vehicle Indicators 
Config.IndicatorLeftKeybind = "LEFT" 
Config.IndicatorRightKeybind = "RIGHT" 
Config.IndicatorHazardsKeybind = "UP" 

-- ============================================
-- HUD SETTINGS
-- ============================================

Config.HUD = {
    enabled = true, -- Line 968: RegisterCommand('hud') toggles visibility
    refreshRate = 100, -- ms - Health/Status update rate (line 179: Wait(100))
    hideInPauseMenu = true,
    hideInVehicle = false,
    useRealTime = false, -- true = real time, false = in-game time
    timeFormat = '24h' -- '24h' or '12h'
}

-- ============================================
-- STATUS BARS (Updated every 250ms - Line 179)
-- ============================================

Config.StatusBars = {
    health = { enabled = true, color = '#ef4444', icon = 'bi-heart-fill' },
    armor = { enabled = true, color = '#3b82f6', icon = 'bi-shield-fill' },
    hunger = { enabled = true, color = '#f59e0b', icon = 'bi-egg-fried' },
    thirst = { enabled = true, color = '#06b6d4', icon = 'bi-droplet-fill' },
    oxygen = { enabled = true, color = '#00bcd4', icon = 'bi-wind', showOnlyUnderwater = true },
    stress = { enabled = true, color = '#9c27b0', icon = 'bi-brain' } -- Works with ESX, QBCore, QBox
}

-- ============================================
-- STRESS SYSTEM SETTINGS
-- ============================================

Config.Stress = {
    enabled = false, -- Enable/disable stress system (set to false to completely disable)
    
    -- Stress Gain (how fast stress increases)
    gainMultiplier = 1.0, -- Global multiplier for stress gain (1.0 = normal, 2.0 = double speed)
    
    -- Stress from Speed (driving/flying fast)
    speedStress = {
        enabled = true,
        threshold = 100, -- Speed (KMH) at which stress starts increasing
        maxSpeed = 200, -- Speed (KMH) at which stress gain is maximum
        gainRate = 0.5 -- Stress gained per second at max speed
    },
    
    -- Stress from Shooting
    shootingStress = {
        enabled = true,
        gainPerShot = 2, -- Stress gained per shot fired
        cooldown = 1000 -- Cooldown between stress gains (ms)
    },
    
    -- Stress from Being Shot At
    beingShotStress = {
        enabled = true,
        gainPerHit = 5, -- Stress gained when hit by bullet
        cooldown = 2000 -- Cooldown between stress gains (ms)
    },
    
    -- Stress from Low Health
    lowHealthStress = {
        enabled = true,
        threshold = 30, -- Health % below which stress increases
        gainRate = 0.3 -- Stress gained per second when below threshold
    },
    
    -- Stress Relief (how fast stress decreases)
    reliefMultiplier = 1.0, -- Global multiplier for stress relief (1.0 = normal, 2.0 = double speed)
    
    -- Natural stress relief when idle/safe
    naturalRelief = {
        enabled = true,
        rate = 0.5 -- Stress lost per second when safe
    },
    
    -- Stress relief from walking/standing still
    calmRelief = {
        enabled = true,
        rate = 1.0 -- Stress lost per second when calm (not in vehicle, not running)
    }
}

-- ============================================
-- VEHICLE HUD (Updated every 50ms - Line 358-660)
-- ============================================

Config.VehicleHUD = {
    enabled = true, -- Line 358: Vehicle HUD thread
    showSpeed = true, -- Line 365-367: speedKmh, speedMph
    showFuel = true, -- Line 369-407: Fuel level (supports multiple fuel systems)
    showRPM = true, -- Line 374-375: RPM
    speedUnit = 'kmh', -- 'kmh' or 'mph' - Can be changed in HUD settings
    showOdometer = true, -- Line 428: odometer
    showGear = true, -- Line 377-378: gear
    showDamage = true, -- Line 380-382: engineHealth
    showDoorWarning = true, -- Line 427: doorOpen
    showSeatbeltWarning = true, -- Line 594-617: Seatbelt alarm
    showEngineWarning = true -- Line 426: engineOn
}

-- ============================================
-- MINIMAP SETTINGS (Line 1192-1223)
-- ============================================

Config.Minimap = {
    enabled = true,
    shape = 'square', -- 'square' or 'rounded' (line 1192: minimapstyle command)
    showOnFoot = true, -- Show minimap when on foot
    showCompassOnFoot = true, -- Show compass when on foot
    showStreetName = true, -- Line 662-663: Location thread
    showZoneName = true, -- Line 664: zoneName
    showNorthBlip = true, -- Show north indicator on minimap
    moveCompassWhenHidden = true, -- Move compass down when minimap is hidden
    size = 180 -- Size in pixels (smaller = 180, default = 200)
}

-- Nearest Postal (NOT IMPLEMENTED)
Config.ShowNearestPostal = false
-- Config.NearestPostalsData = "data/nearest-postal/postals.json"

-- ============================================
-- VOICE SETTINGS (Line 1461-1608)
-- ============================================

Config.Voice = {
    system = 'pma-voice', -- Line 1461: GetResourceState('pma-voice')
    pushToTalkKey = 'N', -- Default push-to-talk key
    showWaveAnimation = true, -- Show wave animation when speaking
    showRadioChannel = true -- Line 1467-1608: Radio channel tracking
}

-- ============================================
-- COMPONENT DISPLAY SETTINGS
-- ============================================

Config.ShowComponents = {
    pedAvatar = false, -- Player avatar (unstable, not implemented)
    voiceOrRadio = true, -- Voice indicator (line 1461-1608)
    serverId = true, -- Server ID (line 119-135: updatePlayerInfo)
    time = true, -- Server time (line 662-688: Location thread with time)
    job = true, -- Job display (line 119-135: updatePlayerInfo)
    gang = false, -- Gang display (QBCore only - not implemented for ESX)
    bankBalance = true, -- Bank balance (line 137-165: updateMoney)
    cashBalance = true, -- Cash balance (line 137-165: updateMoney)
    dirtyMoneyBalance = false, -- Dirty money/black money (line 137-165: updateMoney)
    weapon = true, -- Weapon display (handled in React UI)
    serverLogo = true -- Server logo (line 48-60: setLogoConfig)
}

-- ============================================
-- SERVER LOGO SETTINGS (Line 48-60)
-- ============================================

Config.ServerLogo = {
    enabled = true, -- Enable/disable logo display (line 48-60: setLogoConfig)
    serverName = 'SOLAR SCRIPTS', -- Your server name
    logoPath = 'web/img/logo.png', -- Path to your logo file (relative to resource folder)
    -- Alternative paths you can use:
    -- 'web/img/logo.png'        (recommended - in web/img folder)
    -- 'logo.png'                (in resource root)
    -- 'assets/logo.png'         (in assets folder)
    -- 'images/server-logo.png'  (in images folder)
    scale = 100, -- Logo scale percentage (50-200)
    position = {
        x = 'center', -- 'center' or pixel value (e.g., 960)
        y = 20 -- Pixels from top
    }
}

-- ============================================
-- USER PERMISSIONS
-- ============================================

Config.AllowPlayersToEditSettings = true -- Allow players to edit HUD settings (line 1261: hudsettings command)
Config.AllowUsersToEditLayout = true -- Allow players to drag/resize HUD elements (positioning mode)
Config.AllowServerLogoEditing = true -- Allow players to move/scale server logo

-- ============================================
-- DEFAULT SETTINGS & RESET
-- ============================================

Config.DefaultSettingsData = "data/default-settings.json" -- Path to default settings JSON (for reset button)
Config.DefaultSettingsKvpPrefix = "hud-" -- KVP prefix for saved settings (change to reset all player settings)

-- ============================================
-- TECHNICAL SETTINGS
-- ============================================

Config.UpdateRadarZoom = true -- Enable if radar is flickering/disappearing (line 1215: minimapreset)

-- ============================================
-- DEBUG SETTINGS
-- ============================================

Config.Debug = false -- Enable console logs (print statements throughout client)
Config.DevDeleteAllUserSettingsOnStart = false -- Delete all player settings on resource start (for testing)
