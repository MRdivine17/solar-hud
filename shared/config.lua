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

Config.Locale = "en" -- RESERVED: no translation files ship with the script yet
Config.Currency = "$" -- Money prefix used by every money card in the UI
Config.NumberFormat = "en-US" -- follows [language]-[country code], drives thousand separators

-- ============================================
-- MEASUREMENTS
-- ============================================

Config.SpeedMeasurement = "kmh" -- "kmh" or "mph" - default unit; the player can override it in /hudedit
Config.DistanceMeasurement = "meters" -- "meters" or "feet" - boat depth / wave height readouts
-- NOTE: aircraft altitude always stays in feet (aviation standard, stall warnings depend on it)

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
    enabled = true, -- false = HUD starts hidden (players can still bring it back with /hud)
    refreshRate = 100, -- ms - health/armour/hunger/thirst/stress tick rate (minimum 50)
    hideInPauseMenu = true, -- Hide HUD + minimap while the ESC menu is open
    hideInVehicle = false, -- true = hide the whole HUD (and minimap) while in a vehicle
    useRealTime = false, -- true = real time, false = in-game time
    timeFormat = '24h' -- '24h' or '12h'
}

-- ============================================
-- STATUS BARS (tick rate = Config.HUD.refreshRate)
-- ============================================
-- `enabled = false` hides the bar for everyone and cannot be re-enabled by the
-- player in /hudedit. Colours/icons are player-side settings (/hudedit) - the
-- values below are only used as a reference for your own default-settings.json.

Config.StatusBars = {
    health = { enabled = true, color = '#ef4444', icon = 'bi-heart-fill' },
    armor = { enabled = true, color = '#3b82f6', icon = 'bi-shield-fill' },
    hunger = { enabled = true, color = '#f59e0b', icon = 'bi-egg-fried' },
    thirst = { enabled = true, color = '#06b6d4', icon = 'bi-droplet-fill' },
    -- showOnlyUnderwater = true  -> bar appears while diving only
    -- showOnlyUnderwater = false -> bar doubles as a sprint-stamina bar on land
    oxygen = { enabled = true, color = '#00bcd4', icon = 'bi-wind', showOnlyUnderwater = true },
    stress = { enabled = true, color = '#9c27b0', icon = 'bi-brain' } -- also needs Config.Stress.enabled
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
-- VEHICLE HUD (data pushed every 100ms while in a vehicle)
-- ============================================
-- Every toggle below hides that element in ALL four car HUD styles.

Config.VehicleHUD = {
    enabled = true, -- false = no in-vehicle HUD at all (car / boat / plane / heli)
    showSpeed = true, -- Speedometer number + arc/needle
    showFuel = true, -- Fuel gauge (source = Config.FuelSystem)
    showRPM = true, -- RPM bar / arc
    speedUnit = 'kmh', -- DEPRECATED: use Config.SpeedMeasurement (kept for backwards compat)
    showOdometer = true, -- Odometer readout
    showGear = true, -- Gear indicator
    showDamage = true, -- Engine health gauge + wrench icon
    showDoorWarning = true, -- Open-door warning icon
    showSeatbeltWarning = true, -- Seatbelt warning icon (also needs Config.Seatbelt.enabled)
    showEngineWarning = true -- Engine status icon
}

-- ============================================
-- MINIMAP SETTINGS
-- ============================================

Config.Minimap = {
    enabled = true, -- false = radar never shown, /minimapstyle and /toggleminimap refuse
    shape = 'square', -- 'square', 'rounded' or 'circular' (default style, /minimapstyle can change it)
    showOnFoot = false, -- false = radar only visible while in a vehicle
    showCompassOnFoot = true, -- false = compass card hidden while on foot
    showStreetName = true, -- Street line on the compass card
    showZoneName = true, -- Zone line on the compass card
    showNorthBlip = true, -- North indicator on the minimap
    moveCompassWhenHidden = true, -- Slide the compass down when the radar is hidden
    size = 180 -- Minimap size in pixels (200 = GTA default, smaller = 180)
}

-- Nearest Postal (NOT IMPLEMENTED - no postal dataset ships with the script)
Config.ShowNearestPostal = false
-- Config.NearestPostalsData = "data/nearest-postal/postals.json"

-- ============================================
-- VOICE SETTINGS
-- ============================================

Config.Voice = {
    system = 'pma-voice', -- 'pma-voice', 'mumble-voip', 'saltychat' or anything else = native detection
    pushToTalkKey = 'N', -- INFORMATIONAL ONLY: the voice resource owns this bind, the HUD never registers it
    showWaveAnimation = true, -- Animated bars while talking
    showRadioChannel = true -- false = never display the radio frequency
}

-- ============================================
-- COMPONENT DISPLAY SETTINGS
-- ============================================
-- false = hidden for everyone; players cannot re-enable it in /hudedit.

Config.ShowComponents = {
    pedAvatar = false, -- NOT IMPLEMENTED (no avatar renderer)
    voiceOrRadio = true, -- Voice / radio card (also stops the voice thread when false)
    serverId = true, -- Server ID card
    time = true, -- Time card (also stops the clock thread when false)
    job = true, -- Job card
    gang = false, -- NOT IMPLEMENTED (QBCore gang data is not read)
    bankBalance = true, -- Bank money card
    cashBalance = true, -- Cash money card
    dirtyMoneyBalance = false, -- Dirty / black money card
    weapon = true, -- Weapon + ammo display (also stops the weapon thread when false)
    serverLogo = true -- Server logo image
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

Config.AllowPlayersToEditSettings = true -- false = /hudedit and /hudsettings are not registered
Config.AllowUsersToEditLayout = true -- false = /playerinfoedit, /piedit, /hudposition, /hudpos are not registered
Config.AllowServerLogoEditing = true -- false = the logo cannot be dragged/resized in positioning mode

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
