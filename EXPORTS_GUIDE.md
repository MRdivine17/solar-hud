# 📦 Solar HUD Exports Guide

Complete guide for using Solar HUD notifications and progress bars in your scripts.

**Resource Name:** `solar-hud`

---

## 🔔 Notifications

### Basic Notification

```lua
exports['solar-hud']:ShowNotification(type, title, message)
```

### Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | ✅ Yes | Notification type: `'success'`, `'error'`, `'warning'`, `'info'` |
| `title` | string | ✅ Yes | Notification title |
| `message` | string | ✅ Yes | Notification message |

### Examples:

#### Success Notification
```lua
exports['solar-hud']:ShowNotification('success', 'Payment Received', 'You received $5,000')
```

#### Error Notification
```lua
exports['solar-hud']:ShowNotification('error', 'Access Denied', 'You do not have permission')
```

#### Warning Notification
```lua
exports['solar-hud']:ShowNotification('warning', 'Low Health', 'Your health is below 25%')
```

#### Info Notification
```lua
exports['solar-hud']:ShowNotification('info', 'Server Restart', 'Server will restart in 5 minutes')
```

### Advanced Notification (with custom duration)

```lua
-- Send custom notification with duration
SendNUIMessage({
    action = 'showNotification',
    data = {
        type = 'success',        -- 'success', 'error', 'warning', 'info'
        title = 'Custom Title',
        message = 'Custom message here',
        duration = 5000          -- Duration in milliseconds (default: 3000)
    }
})
```

### Notification Types & Colors:

| Type | Color | Icon | Use Case |
|------|-------|------|----------|
| `success` | Green | ✅ | Successful actions, confirmations |
| `error` | Red | ❌ | Errors, failures, denied actions |
| `warning` | Orange | ⚠️ | Warnings, cautions, alerts |
| `info` | Blue | ℹ️ | Information, tips, updates |

---

## 📊 Progress Bar

### Basic Progress Bar

```lua
exports['solar-hud']:ShowProgressBar(label, duration)
```

### Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `label` | string | ✅ Yes | Progress bar label text |
| `duration` | number | ✅ Yes | Duration in milliseconds |

### Examples:

#### Simple Progress Bar
```lua
-- Show progress bar for 5 seconds
exports['solar-hud']:ShowProgressBar('Loading...', 5000)
```

#### Progress Bar with Action
```lua
-- Lockpicking example
exports['solar-hud']:ShowProgressBar('Lockpicking...', 10000)
Wait(10000)
-- Action completed
```

### Advanced Progress Bar (with custom icon)

```lua
-- Send custom progress bar with icon
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Repairing Vehicle',
        duration = 15000,        -- Duration in milliseconds
        icon = 'mdi-wrench'      -- Material Design Icon (optional)
    }
})
```

### Hide Progress Bar

```lua
-- Hide progress bar manually
SendNUIMessage({
    action = 'hideProgressBar'
})
```

### Available Icons (Material Design Icons):

| Icon Name | Icon | Use Case |
|-----------|------|----------|
| `mdi-timer-sand` | ⏳ | Default timer |
| `mdi-wrench` | 🔧 | Repairing |
| `mdi-hammer` | 🔨 | Crafting |
| `mdi-lock` | 🔒 | Lockpicking |
| `mdi-car` | 🚗 | Vehicle actions |
| `mdi-medical-bag` | 💊 | Medical/healing |
| `mdi-food` | 🍔 | Eating |
| `mdi-water` | 💧 | Drinking |
| `mdi-package` | 📦 | Collecting/packing |
| `mdi-download` | ⬇️ | Downloading/loading |
| `mdi-upload` | ⬆️ | Uploading/saving |
| `mdi-cog` | ⚙️ | Processing |
| `mdi-account` | 👤 | Player actions |
| `mdi-cash` | 💵 | Money transactions |
| `mdi-shopping` | 🛒 | Shopping |
| `mdi-home` | 🏠 | Housing |
| `mdi-briefcase` | 💼 | Job actions |
| `mdi-police-badge` | 👮 | Police actions |
| `mdi-hospital` | 🏥 | Medical actions |
| `mdi-fire` | 🔥 | Fire/emergency |
| `mdi-phone` | 📱 | Phone actions |
| `mdi-email` | 📧 | Messages |
| `mdi-map-marker` | 📍 | Location |
| `mdi-gas-station` | ⛽ | Refueling |
| `mdi-tools` | 🛠️ | Tools/maintenance |

---

## 🎯 Complete Examples

### Example 1: Lockpicking System
```lua
-- Start lockpicking
exports['solar-hud']:ShowNotification('info', 'Lockpicking', 'Starting lockpick...')

SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Lockpicking Door',
        duration = 10000,
        icon = 'mdi-lock'
    }
})

Wait(10000)

-- Success or failure
local success = math.random(1, 100) > 50

if success then
    exports['solar-hud']:ShowNotification('success', 'Lockpicking', 'Door unlocked!')
else
    exports['solar-hud']:ShowNotification('error', 'Lockpicking', 'Lockpick broke!')
end
```

### Example 2: Vehicle Repair
```lua
-- Start repair
exports['solar-hud']:ShowNotification('info', 'Repair', 'Repairing vehicle...')

SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Repairing Engine',
        duration = 15000,
        icon = 'mdi-wrench'
    }
})

Wait(15000)

-- Complete repair
exports['solar-hud']:ShowNotification('success', 'Repair', 'Vehicle repaired!')
```

### Example 3: Eating/Drinking
```lua
-- Eating
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Eating Burger',
        duration = 5000,
        icon = 'mdi-food'
    }
})

Wait(5000)
exports['solar-hud']:ShowNotification('success', 'Food', 'You ate a burger')

-- Drinking
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Drinking Water',
        duration = 3000,
        icon = 'mdi-water'
    }
})

Wait(3000)
exports['solar-hud']:ShowNotification('success', 'Drink', 'You drank water')
```

### Example 4: Crafting System
```lua
-- Start crafting
exports['solar-hud']:ShowNotification('info', 'Crafting', 'Crafting item...')

SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Crafting Lockpick',
        duration = 8000,
        icon = 'mdi-hammer'
    }
})

Wait(8000)

exports['solar-hud']:ShowNotification('success', 'Crafting', 'Lockpick crafted!')
```

### Example 5: Money Transaction
```lua
-- Withdrawing money
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Withdrawing $5,000',
        duration = 3000,
        icon = 'mdi-cash'
    }
})

Wait(3000)

exports['solar-hud']:ShowNotification('success', 'Bank', 'Withdrew $5,000')
```

### Example 6: Medical Treatment
```lua
-- Healing player
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Applying Bandage',
        duration = 6000,
        icon = 'mdi-medical-bag'
    }
})

Wait(6000)

exports['solar-hud']:ShowNotification('success', 'Medical', 'Bandage applied +25 HP')
```

### Example 7: Refueling Vehicle
```lua
-- Refueling
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Refueling Vehicle',
        duration = 10000,
        icon = 'mdi-gas-station'
    }
})

Wait(10000)

exports['solar-hud']:ShowNotification('success', 'Fuel', 'Vehicle refueled')
```

---

## 🎨 Customization

### Custom Notification Duration
```lua
-- 10 second notification
SendNUIMessage({
    action = 'showNotification',
    data = {
        type = 'warning',
        title = 'Important',
        message = 'This message stays for 10 seconds',
        duration = 10000
    }
})
```

### Progress Bar with Callback
```lua
-- Show progress bar
SendNUIMessage({
    action = 'showProgressBar',
    data = {
        visible = true,
        label = 'Processing...',
        duration = 5000,
        icon = 'mdi-cog'
    }
})

-- Wait for completion
Wait(5000)

-- Hide and show result
SendNUIMessage({ action = 'hideProgressBar' })
exports['hud-system']:ShowNotification('success', 'Complete', 'Processing finished!')
```

---

## 📝 Best Practices

### ✅ DO:
- Use appropriate notification types for context
- Keep messages short and clear
- Use icons that match the action
- Set reasonable durations (3-5 seconds for notifications)
- Hide progress bars when actions are cancelled

### ❌ DON'T:
- Don't spam notifications
- Don't use extremely long durations
- Don't use misleading notification types
- Don't forget to hide progress bars after completion

---

## 🔧 Integration Examples

### ESX Framework
```lua
-- ESX money notification
RegisterNetEvent('esx:addedMoney')
AddEventHandler('esx:addedMoney', function(money)
    exports['solar-hud']:ShowNotification('success', 'Money', 'Received $' .. money)
end)
```

### QBCore Framework
```lua
-- QBCore notification
RegisterNetEvent('QBCore:Notify')
AddEventHandler('QBCore:Notify', function(text, type)
    local notifType = type or 'info'
    exports['solar-hud']:ShowNotification(notifType, 'Notification', text)
end)
```

---

## 📚 Additional Resources

For more Material Design Icons, visit:
https://materialdesignicons.com/

Icon format: `mdi-icon-name`

Example: `mdi-account`, `mdi-car`, `mdi-home`

---

## 💡 Tips

1. **Notification Positioning**: Configured in HUD settings (bottom-left, bottom-right, top-left, top-right)
2. **Progress Bar Styling**: Automatically styled based on HUD theme
3. **Multiple Notifications**: Stack automatically with smooth animations
4. **Progress Bar Cancellation**: Hide manually with `hideProgressBar` action

---

## 🎉 Summary

- **Notifications**: 4 types (success, error, warning, info)
- **Progress Bars**: Customizable with 25+ icons
- **Easy Integration**: Simple exports for any script
- **Flexible**: Custom durations, icons, and messages

Use these exports to create a consistent and professional user experience across your server!
