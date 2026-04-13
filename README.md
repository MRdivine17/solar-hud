# 🌟 Solar HUD - Advanced FiveM HUD System

A modern, fully customizable HUD system for FiveM servers with React UI, multiple framework support, and extensive configuration options.

---
## 📞 Support

Need help? We're here for you!

- **Discord:** [Join Our Discord](https://discord.gg/bjVfEtRj6h)
- **Tebex:** [Open Support Ticket](https://www.solarscript.in)
- **Documentation:** Available in Discord

**Before asking for support:**
1. Check this README
2. Check EXPORTS_GUIDE.md
3. Check F8 console for errors
4. Try resetting settings (`/hudedit` > Reset All Settings)

---

## 📦 Purchase & Support

- **🛒 Purchase:** [Tebex Store](https://www.solarscript.in)
- **💬 Discord Support:** [Join Our Discord](https://discord.gg/bjVfEtRj6h)
- **📚 Documentation:** Full guides available in our Discord

---

## ✨ Features

### 🎨 Fully Customizable UI
- **4 Status Bar Styles:** Progress Outline, Progress Fill, Percentages, Progress Bar
- **3 Border Radius Options:** Fully Rounded, Slightly Rounded, Square
- **3 Player Info Layouts:** Miniature, Grid, Modern
- **4 Card Styles:** Rounded, Square, Angled, Hexagon
- **Drag & Drop Positioning:** Move any HUD element anywhere on screen
- **Color Customization:** Change colors for every element
- **Import/Export Settings:** Share your HUD layout with others

### 🧠 Advanced Stress System
- **Framework Support:** Works with ESX, QBCore, QBox
- **Dynamic Stress Gain:** Increases from high-speed driving, shooting, being shot, low health
- **Natural Stress Relief:** Decreases when calm, standing still, or walking
- **Fully Configurable:** Enable/disable individual stress sources, adjust gain/relief rates
- **Visual Indicator:** Stress bar shows current stress level in real-time

### 🚗 Vehicle HUD
- **4 Vehicle HUD Styles:** Default, Circular, Style 3, Style 4
- **3 Boat HUD Styles:** Boat 1, Boat 2, Boat 3
- **Flight HUD:** Dedicated HUD for planes with pitch, roll, altitude
- **Helicopter HUD:** Specialized HUD for helicopters
- **Speed Units:** KMH or MPH (changeable in settings)
- **Fuel Integration:** Supports 15+ fuel systems
- **Indicators:** Turn signals, hazard lights, seatbelt warnings

### 🗺️ Minimap & Compass
- **Multiple Minimap Styles:** Square, Rounded
- **Compass Display:** Shows direction, street name, zone
- **Customizable Colors:** Change compass colors
- **Show/Hide Options:** Toggle minimap on foot or in vehicle

### 👤 Player Information
- **Server ID:** Display player's server ID
- **Job Display:** Shows current job
- **Money Display:** Bank, Cash, Dirty Money
- **Time Display:** Server time or real-time
- **Voice Indicator:** Shows voice mode and radio channel
- **Weapon Display:** Current weapon with ammo count

### 🔔 Notifications & Progress Bars
- **4 Notification Types:** Success, Error, Warning, Info
- **Customizable Positions:** 9 screen positions available
- **Progress Bars:** For actions like lockpicking, crafting, eating
- **25+ Material Icons:** Choose from various icons
- **Export System:** Use in your own scripts (see EXPORTS_GUIDE.md)

### 🎵 Music Player
- **YouTube Integration:** Play YouTube music in-game
- **Playlist Management:** Create and save playlists
- **Volume Control:** Adjust volume and mute
- **Persistent Storage:** Playlists saved locally

---

## 🔧 Framework Support

**Auto-Detection:** Automatically detects your framework
- ✅ ESX Legacy
- ✅ QBCore
- ✅ QBox
- ✅ Standalone (no framework required)

---

## 📥 Installation

1. **Download** the script from your purchase
2. **Extract** the folder to your server's `resources` directory
3. **Rename** the folder to `solar-hud` (or any name you prefer)
4. **Add** to your `server.cfg`:
   ```cfg
   ensure solar-hud
   ```
5. **Configure** `config.lua` to match your server setup
6. **Restart** your server

---

## ⚙️ Configuration

All settings are in `config.lua`. Here are the key options:

### Framework & Integration
```lua
Config.Framework = "auto" -- Auto-detects ESX, QBCore, QBox, or standalone
Config.FuelSystem = "ox_fuel" -- Supports 15+ fuel systems
```

### Locale & Formatting
```lua
Config.Locale = "en"
Config.Currency = "$"
Config.SpeedMeasurement = "kmh" -- or "mph"
```

### Commands
```lua
Config.OpenSettingsCommand = "hudedit" -- Opens HUD editor
Config.ToggleHudCommand = "hud" -- Toggles HUD visibility
```

### Keybinds
```lua
Config.VehicleControlKeybind = "F4" -- Vehicle menu
Config.Seatbelt.key = "B" -- Seatbelt toggle
Config.BoatAnchorKeybind = "J" -- Boat anchor
Config.IndicatorLeftKeybind = "LEFT" -- Left turn signal
Config.IndicatorRightKeybind = "RIGHT" -- Right turn signal
Config.IndicatorHazardsKeybind = "UP" -- Hazard lights
```

### Server Logo
```lua
Config.ServerLogo = {
    enabled = true,
    serverName = 'YOUR SERVER NAME',
    logoPath = 'web/img/logo.png', -- Place your logo here
    scale = 100,
    position = { x = 'center', y = 20 }
}
```

### Stress System
```lua
Config.Stress = {
    enabled = true, -- Enable/disable stress system
    
    -- Stress from speed (driving fast)
    speedStress = {
        enabled = true,
        threshold = 100, -- KMH when stress starts
        gainRate = 0.5 -- Stress per second at max speed
    },
    
    -- Stress from shooting
    shootingStress = {
        enabled = true,
        gainPerShot = 2 -- Stress per shot fired
    },
    
    -- Stress from being shot
    beingShotStress = {
        enabled = true,
        gainPerHit = 5 -- Stress when hit
    },
    
    -- Stress from low health
    lowHealthStress = {
        enabled = true,
        threshold = 30, -- Health % threshold
        gainRate = 0.3 -- Stress per second
    },
    
    -- Natural stress relief
    naturalRelief = {
        enabled = true,
        rate = 0.5 -- Stress lost per second when safe
    }
}
```

### Permissions
```lua
Config.AllowPlayersToEditSettings = true -- Players can customize HUD
Config.AllowUsersToEditLayout = true -- Players can move elements
Config.AllowServerLogoEditing = true -- Players can move logo
```

---

## 🎮 In-Game Commands

| Command | Description |
|---------|-------------|
| `/hudedit` | Opens HUD settings menu (customize everything) |
| `/hud` | Toggles HUD visibility (cinematic mode) |
| `/hudsettings` | Alternative command for HUD settings |
| `/playerinfoedit` | Opens player info positioning mode |
| `/piedit` | Shortcut for player info positioning |
| `/minimapstyle` | Changes minimap style |
| `/toggleminimap` | Toggles minimap visibility |

---

## ⌨️ Default Keybinds

| Key | Action |
|-----|--------|
| **F4** | Vehicle Menu (windows, doors, seats, engine) |
| **B** | Toggle Seatbelt |
| **J** | Boat Anchor (when in boat) |
| **←** | Left Turn Signal |
| **→** | Right Turn Signal |
| **↑** | Hazard Lights |

*All keybinds can be changed in FiveM's Settings > Key Bindings > FiveM*

---

## 🎨 Customization Guide

### Editing HUD Settings
1. Press **F1** or type `/hudedit` in chat
2. Use the sidebar to navigate between sections:
   - **Health:** Status bars, colors, visibility
   - **Vehicle:** Vehicle HUD styles and colors
   - **Boat:** Boat HUD styles and colors
   - **Flight:** Plane and helicopter HUD
   - **Minimap:** Minimap and compass settings
   - **Player Info:** Layout, colors, visibility
   - **Notifications:** Position, colors, style
   - **Progress Bar:** Position, colors, style
   - **Import/Export:** Share your settings

### Moving HUD Elements
1. Open HUD settings (`/hudedit`)
2. Click **"Edit Positions"** button
3. Drag any element to move it
4. Drag the blue circle on elements to resize
5. Press **ESC** to save positions

### Resetting to Default
1. Open HUD settings (`/hudedit`)
2. Click **"Reset All Settings"** button
3. Confirm the reset
4. Page will reload with default settings

---

## 🔌 Fuel System Support

Supports 15+ popular fuel systems:
- ox_fuel
- LegacyFuel
- lc_fuel
- ps-fuel
- lj-fuel
- cdn-fuel
- hyon_gas_station
- okokGasStation
- nd_fuel
- myFuel
- ti_fuel
- Renewed-Fuel
- rcore_fuel
- none (disable fuel)

Set your fuel system in `config.lua`:
```lua
Config.FuelSystem = "ox_fuel"
```

---

## 📤 Using Exports in Your Scripts

Solar HUD provides exports for notifications and progress bars. See **EXPORTS_GUIDE.md** for detailed examples.

### Quick Example - Notification
```lua
exports['solar-hud']:ShowNotification('success', 'Success!', 'Action completed successfully')
```

### Quick Example - Progress Bar
```lua
exports['solar-hud']:ShowProgressBar('Lockpicking...', 5000, 'mdi-lock-open-variant')
```

---

## 🐛 Troubleshooting

### HUD Not Showing
- Check that resource is started: `ensure solar-hud` in server.cfg
- Try `/hud` command to toggle visibility
- Check F8 console for errors

### Fuel Not Working
- Verify your fuel system in `config.lua`
- Ensure fuel resource is started before solar-hud
- Check fuel export name matches your fuel script

### Minimap Issues
- Try `/minimapstyle` to change style
- Enable `Config.UpdateRadarZoom = true` in config.lua
- Use `/minimapreset` command

### Settings Not Saving
- Settings are saved in browser localStorage
- Clear cache if settings don't persist
- Check `Config.AllowPlayersToEditSettings = true`

### Performance Issues
- Disable unused components in `Config.ShowComponents`
- Reduce `Config.HUD.refreshRate` (default: 100ms)
- Set `Config.Debug = false`

---

## 📊 Performance

- **Idle (on foot):** 0.02-0.05ms
- **In vehicle:** 0.05-0.08ms
- **Optimized threads:** Smart Wait() times based on activity
- **Conditional updates:** Only updates visible elements

---

## 🔄 Updates & Changelog

Updates are delivered through Tebex. Join our Discord for update notifications and changelogs.

## 📜 License

This script is licensed for use on a single FiveM server. Redistribution or resale is prohibited.

---

## 🙏 Credits

**Developed by:** Solar Scripts  
**Framework Support:** ESX, QBCore, QBox  
**UI Framework:** React + Vite + TypeScript  

---

## ⭐ Enjoy Solar HUD!

Thank you for your purchase! If you enjoy the script, please leave a review on Tebex and join our Discord community.

**Happy gaming! 🎮**
