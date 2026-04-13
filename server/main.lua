-- ============================================
-- FRAMEWORK DETECTION & INITIALIZATION
-- ============================================
local Framework = nil
local FrameworkName = "standalone"
local ESX = nil
local QBCore = nil
local QBX = nil

-- Auto-detect framework
CreateThread(function()
    Wait(500)
    
    -- Try ESX
    if GetResourceState('es_extended') == 'started' then
        local success, result = pcall(function()
            return exports['es_extended']:getSharedObject()
        end)
        
        if success and result then
            ESX = result
            Framework = ESX
            FrameworkName = "ESX"
            print('[HUD] Framework detected: ESX')
        else
            print('[HUD] WARNING: es_extended is running but getSharedObject failed')
        end
    -- Try QBCore
    elseif GetResourceState('qb-core') == 'started' then
        local success, result = pcall(function()
            return exports['qb-core']:GetCoreObject()
        end)
        
        if success and result then
            QBCore = result
            Framework = QBCore
            FrameworkName = "QBCore"
            print('[HUD] Framework detected: QBCore')
        else
            print('[HUD] WARNING: qb-core is running but GetCoreObject failed')
        end
    -- Try QBox
    elseif GetResourceState('qbx_core') == 'started' or GetResourceState('qbox-core') == 'started' then
        local success, result = pcall(function()
            return exports.qbx_core or exports['qbox-core']
        end)
        
        if success and result then
            QBX = result
            Framework = QBX
            FrameworkName = "QBox"
            print('[HUD] Framework detected: QBox')
        else
            print('[HUD] WARNING: qbox-core is running but export failed')
        end
    else
        FrameworkName = "standalone"
        print('[HUD] No framework detected - Running in standalone mode')
    end
end)

-- Helper function to get player from framework
local function GetPlayer(source)
    if FrameworkName == "ESX" and ESX then
        return ESX.GetPlayerFromId(source)
    elseif FrameworkName == "QBCore" and QBCore then
        return QBCore.Functions.GetPlayer(source)
    elseif FrameworkName == "QBox" and QBX then
        return QBX.Functions.GetPlayer(source)
    end
    return nil
end

-- Helper function to get player identifier
local function GetPlayerIdentifier(source)
    local player = GetPlayer(source)
    
    if FrameworkName == "ESX" and player then
        return player.identifier
    elseif (FrameworkName == "QBCore" or FrameworkName == "QBox") and player then
        return player.PlayerData.citizenid
    else
        -- Fallback to license identifier
        return GetPlayerIdentifiers(source)[1]
    end
end

-- Store player HUD settings in memory (could be saved to database)
local playerSettings = {}

-- Rate limiting system to prevent network overflow
local saveQueue = {} -- Queue pending saves per player
local saveTimers = {} -- Timers for debounced saves
local SAVE_DEBOUNCE_DELAY = 3000 -- 3 seconds delay (in milliseconds)

-- Event to save HUD settings with server-side rate limiting
RegisterNetEvent('hud:saveSettings')
AddEventHandler('hud:saveSettings', function(settings)
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if not identifier then return end
    
    -- Store the latest settings in queue
    saveQueue[identifier] = {
        settings = settings,
        source = source
    }
    
    -- Clear existing timer if any
    if saveTimers[identifier] then
        saveTimers[identifier] = nil
    end
    
    -- Set new timer - only save after player stops making changes
    saveTimers[identifier] = true
    
    SetTimeout(SAVE_DEBOUNCE_DELAY, function()
        -- Check if this timer is still valid (not replaced by newer changes)
        if saveTimers[identifier] and saveQueue[identifier] then
            local queuedData = saveQueue[identifier]
            
            -- Save the settings
            playerSettings[identifier] = queuedData.settings
           -- print('[HUD] Settings saved for player: ' .. identifier .. ' (after ' .. SAVE_DEBOUNCE_DELAY .. 'ms debounce)')
            
            -- Optional: Save to database here
            -- MySQL.Async.execute('UPDATE users SET hud_settings = @settings WHERE identifier = @identifier', {
            --     ['@identifier'] = identifier,
            --     ['@settings'] = json.encode(queuedData.settings)
            -- })
            
            -- Clear queue and timer
            saveQueue[identifier] = nil
            saveTimers[identifier] = nil
        end
    end)
end)

-- Event to load HUD settings
RegisterNetEvent('hud:loadSettings')
AddEventHandler('hud:loadSettings', function()
    local source = source
    local identifier = GetPlayerIdentifier(source)
    
    if identifier then
        local settings = playerSettings[identifier]
        
        if settings then
            print('[HUD] Loading saved settings for player: ' .. identifier)
            TriggerClientEvent('hud:receiveSettings', source, settings)
        else
            print('[HUD] No saved settings for player: ' .. identifier .. ', loading defaults from file')
            
            -- Load default settings from JSON file
            local defaultSettingsFile = LoadResourceFile(GetCurrentResourceName(), 'data/default-settings.json')
            
            if defaultSettingsFile then
                local defaultConfig = json.decode(defaultSettingsFile)
                if defaultConfig and defaultConfig.settings then
                    print('[HUD] Sending default settings to new player')
                    TriggerClientEvent('hud:receiveSettings', source, defaultConfig.settings)
                else
                    print('[HUD] ERROR: Failed to parse default-settings.json')
                end
            else
                print('[HUD] ERROR: Could not load data/default-settings.json')
            end
        end
        
        -- Optional: Load from database here
        -- MySQL.Async.fetchAll('SELECT hud_settings FROM users WHERE identifier = @identifier', {
        --     ['@identifier'] = identifier
        -- }, function(result)
        --     if result[1] and result[1].hud_settings then
        --         local settings = json.decode(result[1].hud_settings)
        --         TriggerClientEvent('hud:receiveSettings', source, settings)
        --     end
        -- end)
    end
end)

-- Test Commands for Notifications
RegisterCommand('notifytest', function(source, args, rawCommand)
    local notificationType = args[1] or 'info'
    local title = args[2] or 'Notification'
    local message = table.concat(args, ' ', 3) or 'Test notification'
    local duration = tonumber(args[#args]) or 3000
    
    TriggerClientEvent('notify:test', source, notificationType, title, message, duration)
end, false)

RegisterCommand('notifysuccess', function(source, args, rawCommand)
    local title = args[1] or 'Success'
    local message = table.concat(args, ' ', 2) or 'Operation successful!'
    TriggerClientEvent('notify:test', source, 'success', title, message, 3000)
end, false)

RegisterCommand('notifyerror', function(source, args, rawCommand)
    local title = args[1] or 'Error'
    local message = table.concat(args, ' ', 2) or 'An error occurred!'
    TriggerClientEvent('notify:test', source, 'error', title, message, 3000)
end, false)

RegisterCommand('notifyinfo', function(source, args, rawCommand)
    local title = args[1] or 'Information'
    local message = table.concat(args, ' ', 2) or 'Information message'
    TriggerClientEvent('notify:test', source, 'info', title, message, 3000)
end, false)

-- Server Event: Update Minimap Style
RegisterNetEvent('hud:updateMinimapStyle')
AddEventHandler('hud:updateMinimapStyle', function(minimapStyle)
    local source = source
    if minimapStyle then
        -- Broadcast to all clients
        TriggerClientEvent('hud:updateMinimapStyle', -1, minimapStyle)
      --  print('[HUD] Minimap style update triggered: ' .. minimapStyle)
    end
end)

-- ============================================
-- STRESS SYSTEM (Framework-Agnostic)
-- ============================================

-- Update stress for all frameworks
RegisterNetEvent('hud:server:UpdateStress')
AddEventHandler('hud:server:UpdateStress', function(stressValue)
    local src = source
    local player = GetPlayer(src)
    
    if not player then return end
    
    local stressFloor = math.floor(stressValue)
    
    if FrameworkName == "ESX" and ESX then
        -- ESX uses esx_status
        TriggerEvent('esx_status:set', src, 'stress', stressFloor * 10000) -- ESX uses 0-1000000 scale
    elseif FrameworkName == "QBCore" and QBCore then
        -- QBCore uses player metadata
        player.Functions.SetMetaData('stress', stressFloor)
    elseif FrameworkName == "QBox" and QBX then
        -- QBox uses player metadata
        player.Functions.SetMetaData('stress', stressFloor)
    end
end)

-- print('[HUD] Server loaded successfully')
-- print('[HUD] Test Commands:')
-- print('[HUD] /notifytest [type] [message] - Test notification')
-- print('[HUD] /notifysuccess [message] - Test success notification')
-- print('[HUD] /notifyerror [message] - Test error notification')
-- print('[HUD] /notifyinfo [message] - Test info notification')
