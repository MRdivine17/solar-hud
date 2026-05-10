local hudActive = true
local playerData = {}
local Framework = nil
local FrameworkName = "standalone"
local ESX = nil
local QBCore = nil
local QBX = nil

-- ============================================
-- FRAMEWORK DETECTION & INITIALIZATION
-- ============================================
local function InitializeFramework()
    if Config.Framework == "auto" then
        -- Auto-detect framework
        if GetResourceState('es_extended') == 'started' then
            local success, result = pcall(function()
                return exports['es_extended']:getSharedObject()
            end)
            
            if success and result then
                ESX = result
                Framework = ESX
                FrameworkName = "ESX"
                -- Framework detected: ESX
            else
                print('[HUD] WARNING: es_extended is running but getSharedObject failed')
            end
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
    elseif Config.Framework == "ESX" then
        local success, result = pcall(function()
            return exports['es_extended']:getSharedObject()
        end)
        if success and result then
            ESX = result
            Framework = ESX
            FrameworkName = "ESX"
        end
    elseif Config.Framework == "QBCore" then
        local success, result = pcall(function()
            return exports['qb-core']:GetCoreObject()
        end)
        if success and result then
            QBCore = result
            Framework = QBCore
            FrameworkName = "QBCore"
        end
    elseif Config.Framework == "QBox" then
        local success, result = pcall(function()
            return exports.qbx_core or exports['qbox-core']
        end)
        if success and result then
            QBX = result
            Framework = QBX
            FrameworkName = "QBox"
        end
    else
        FrameworkName = "standalone"
    end
end

-- Initialize framework on resource start
CreateThread(function()
    Wait(500)
    InitializeFramework()
end)

-- Custom notification helper function (defined early for use throughout the script)
local function ShowCustomNotification(type, title, message)
    SendNUIMessage({
        action = 'showNotification',
        data = {
            type = type,
            title = title,
            message = message,
            duration = 3000
        }
    })
end

-- Function to refresh minimap display
local function RefreshMinimap()
    -- Set minimap component position to force refresh
    SetRadarBigmapEnabled(true, false)
    Citizen.Wait(0)
    SetRadarBigmapEnabled(false, false)
    
    -- Ensure radar is displayed
    DisplayRadar(true)
    
    -- Force minimap to update
    Citizen.Wait(100)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    SetFocusPosAndVel(coords.x, coords.y, coords.z, 0.0, 0.0, 0.0)
    Citizen.Wait(100)
    ClearFocus()
    
    -- print('[HUD] Minimap refreshed')
end

-- Refresh minimap when resource starts
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        if Config.Debug then print('[HUD] Resource started, requesting settings from server...') end
        Citizen.Wait(1000) -- Wait for game to be ready
        
        -- Delete all user settings if enabled (for testing)
        if Config.DevDeleteAllUserSettingsOnStart then
            if Config.Debug then print('[HUD] Deleting all user settings...') end
            SendNUIMessage({ action = 'deleteAllSettings' })
        end
        
        -- Send logo config to NUI (only if enabled)
        if Config.ShowComponents.serverLogo and Config.ServerLogo.enabled then
            SendNUIMessage({
                action = 'setLogoConfig',
                data = {
                    enabled = Config.ServerLogo.enabled,
                    serverName = Config.ServerLogo.serverName,
                    logoPath = Config.ServerLogo.logoPath,
                    scale = Config.ServerLogo.scale,
                    position = Config.ServerLogo.position
                }
            })
            if Config.Debug then print('[HUD] Logo config sent: ' .. Config.ServerLogo.logoPath) end
        end
        
        -- Minimap style is loaded from localStorage in React (no server-side loading)
        if Config.Debug then print('[HUD] Minimap style will be loaded from localStorage') end
        currentMinimapStyle = Config.Minimap.shape or 'rounded' -- Use config default
        minimapStyleLoaded = true
        
        -- Only refresh minimap if enabled
        if Config.Minimap.enabled then
            RefreshMinimap()
        end
    end
end)

-- Refresh minimap when player spawns
AddEventHandler('playerSpawned', function()
    Citizen.Wait(1000)
    
    -- Wait for minimap style if not loaded yet
    local timeout = 0
    while not minimapStyleLoaded and timeout < 30 do
        Citizen.Wait(100)
        timeout = timeout + 1
    end
    
    RefreshMinimap()
end)

-- Also refresh on first frame
Citizen.CreateThread(function()
    Citizen.Wait(3000) -- Wait 3 seconds after script load
    
    -- Wait for minimap style if not loaded yet
    local timeout = 0
    while not minimapStyleLoaded and timeout < 30 do
        Citizen.Wait(100)
        timeout = timeout + 1
    end
    
    RefreshMinimap()
end)

-- Function to fetch and send all player data
local function UpdateAllPlayerData()
    -- Skip if no framework or in standalone mode
    if FrameworkName == "standalone" or not Framework then
        return
    end
    
    -- Get fresh player data based on framework
    if FrameworkName == "ESX" and ESX then
        ESX.PlayerData = ESX.GetPlayerData()
        playerData = ESX.PlayerData
    elseif (FrameworkName == "QBCore" or FrameworkName == "QBox") and Framework then
        playerData = Framework.Functions.GetPlayerData()
    end
    
    if not playerData then
        print('[HUD] Player data not available yet')
        return
    end
    
    -- Send server ID and job (only if enabled in config)
    if Config.ShowComponents.serverId or Config.ShowComponents.job then
        local serverId = GetPlayerServerId(PlayerId())
        local jobLabel = 'Unemployed'
        local jobGrade = ''
        
        if FrameworkName == "ESX" then
            if playerData.job then
                jobLabel = playerData.job.label or 'Unemployed'
                jobGrade = playerData.job.grade_label or ''
            end
        elseif FrameworkName == "QBCore" or FrameworkName == "QBox" then
            if playerData.job then
                jobLabel = playerData.job.label or 'Unemployed'
                jobGrade = playerData.job.grade.name or ''
            end
        end
        
        local dataToSend = {}
        if Config.ShowComponents.serverId then
            dataToSend.serverId = serverId
        end
        if Config.ShowComponents.job then
            dataToSend.job = jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or '')
        end
        
        SendNUIMessage({
            action = 'updatePlayerInfo',
            data = {
                data = dataToSend
            }
        })
    end
    
    -- print('[HUD] Sent player info - ID: ' .. serverId .. ', Job: ' .. jobLabel)
    
    -- Send money data (only if enabled in config)
    if Config.ShowComponents.cashBalance or Config.ShowComponents.bankBalance or Config.ShowComponents.dirtyMoneyBalance then
        local cash = 0
        local bank = 0
        local dirty = 0
        
        if FrameworkName == "ESX" then
            if playerData.accounts then
                for i=1, #playerData.accounts do
                    if playerData.accounts[i].name == 'money' then
                        cash = playerData.accounts[i].money
                    elseif playerData.accounts[i].name == 'bank' then
                        bank = playerData.accounts[i].money
                    elseif playerData.accounts[i].name == 'black_money' then
                        dirty = playerData.accounts[i].money
                    end
                end
            end
        elseif FrameworkName == "QBCore" or FrameworkName == "QBox" then
            if playerData.money then
                cash = playerData.money.cash or 0
                bank = playerData.money.bank or 0
                dirty = playerData.money.crypto or 0 -- QBCore uses crypto instead of dirty money
            end
        end
        
        local dataToSend = {}
        if Config.ShowComponents.cashBalance then
            dataToSend.cash = cash
        end
        if Config.ShowComponents.bankBalance then
            dataToSend.bank = bank
        end
        if Config.ShowComponents.dirtyMoneyBalance then
            dataToSend.dirty = dirty
        end
        
        SendNUIMessage({
            action = 'updateMoney',
            data = {
                data = dataToSend
            }
        })
    end
end

-- ============================================
-- PLAYER LOADED EVENTS (Framework-Agnostic)
-- ============================================

-- ESX Player Loaded
RegisterNetEvent('esx:playerLoaded')
AddEventHandler('esx:playerLoaded', function(xPlayer)
    playerData = xPlayer
    SendNUIMessage({ action = 'setVisible', data = { visible = true } })
    
    print('[HUD] ESX Player loaded')
    
    -- Wait for ESX to fully load
    Wait(2000)
    
    -- Fetch and send all data
    UpdateAllPlayerData()
    
    -- Request minimap position from server
    TriggerServerEvent('hud:loadMinimapPosition')
end)

-- QBCore Player Loaded
RegisterNetEvent('QBCore:Client:OnPlayerLoaded')
AddEventHandler('QBCore:Client:OnPlayerLoaded', function()
    SendNUIMessage({ action = 'setVisible', data = { visible = true } })
    
    print('[HUD] QBCore Player loaded')
    
    -- Wait for QBCore to fully load
    Wait(2000)
    
    -- Fetch and send all data
    UpdateAllPlayerData()
    
    -- Request minimap position from server
    TriggerServerEvent('hud:loadMinimapPosition')
end)

-- QBox Player Loaded
RegisterNetEvent('QBCore:Client:OnPlayerLoaded')
AddEventHandler('QBCore:Client:OnPlayerLoaded', function()
    SendNUIMessage({ action = 'setVisible', data = { visible = true } })
    
    print('[HUD] QBox Player loaded')
    
    -- Wait for QBox to fully load
    Wait(2000)
    
    -- Fetch and send all data
    UpdateAllPlayerData()
    
    -- Request minimap position from server
    TriggerServerEvent('hud:loadMinimapPosition')
end)

-- ============================================
-- JOB CHANGE EVENTS (Framework-Agnostic)
-- ============================================

-- ESX Job Change
RegisterNetEvent('esx:setJob')
AddEventHandler('esx:setJob', function(job)
    playerData.job = job
    
    local serverId = GetPlayerServerId(PlayerId())
    local jobLabel = job.label or 'Unemployed'
    local jobGrade = job.grade_label or ''
    
    SendNUIMessage({
        action = 'updatePlayerInfo',
        data = {
            data = {
                serverId = serverId,
                job = jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or '')
            }
        }
    })
    
    -- print('[HUD] Job updated: ' .. jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or ''))
end)

-- QBCore/QBox Job Change
RegisterNetEvent('QBCore:Client:OnJobUpdate')
AddEventHandler('QBCore:Client:OnJobUpdate', function(job)
    if FrameworkName == "QBCore" or FrameworkName == "QBox" then
        playerData.job = job
        
        local serverId = GetPlayerServerId(PlayerId())
        local jobLabel = job.label or 'Unemployed'
        local jobGrade = job.grade.name or ''
        
        SendNUIMessage({
            action = 'updatePlayerInfo',
            data = {
                data = {
                    serverId = serverId,
                    job = jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or '')
                }
            }
        })
        
        -- print('[HUD] Job updated: ' .. jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or ''))
    end
end)

-- ============================================
-- STRESS SYSTEM (Framework-Agnostic)
-- ============================================
local currentStress = 0
local lastShootTime = 0
local lastHitTime = 0

-- Function to get stress level from framework
local function GetFrameworkStress()
    if not Config.Stress.enabled or not Config.StatusBars.stress.enabled then
        return 0
    end
    
    if FrameworkName == "ESX" then
        -- ESX uses esx_status
        local stressLevel = 0
        TriggerEvent('esx_status:getStatus', 'stress', function(stress)
            if stress then
                stressLevel = math.floor(stress.getPercent())
            end
        end)
        return stressLevel
    elseif FrameworkName == "QBCore" or FrameworkName == "QBox" then
        -- QBCore/QBox uses player metadata
        if Framework and Framework.Functions then
            local PlayerData = Framework.Functions.GetPlayerData()
            if PlayerData and PlayerData.metadata and PlayerData.metadata.stress then
                return math.floor(PlayerData.metadata.stress)
            end
        end
        return currentStress
    else
        -- Standalone - use local stress tracking
        return currentStress
    end
end

-- Function to set stress level in framework
local function SetFrameworkStress(value)
    if not Config.Stress.enabled or not Config.StatusBars.stress.enabled then
        return
    end
    
    value = math.max(0, math.min(100, value))
    currentStress = value
    
    if FrameworkName == "ESX" then
        -- ESX uses esx_status
        TriggerEvent('esx_status:set', 'stress', value * 10000) -- ESX uses 0-1000000 scale
    elseif FrameworkName == "QBCore" then
        -- QBCore uses player metadata
        TriggerServerEvent('hud:server:UpdateStress', value)
    elseif FrameworkName == "QBox" then
        -- QBox uses player metadata
        TriggerServerEvent('hud:server:UpdateStress', value)
    end
end

-- Stress gain/loss thread
CreateThread(function()
    while true do
        Wait(1000) -- Update every second
        
        if Config.Stress.enabled and Config.StatusBars.stress.enabled and hudActive then
            local ped = PlayerPedId()
            local stress = GetFrameworkStress()
            local stressChange = 0
            
            -- Speed stress (driving/flying fast)
            if Config.Stress.speedStress.enabled then
                local vehicle = GetVehiclePedIsIn(ped, false)
                if vehicle ~= 0 and GetPedInVehicleSeat(vehicle, -1) == ped then
                    local speed = GetEntitySpeed(vehicle) * 3.6 -- Convert to KMH
                    if speed > Config.Stress.speedStress.threshold then
                        local speedPercent = math.min(1.0, (speed - Config.Stress.speedStress.threshold) / (Config.Stress.speedStress.maxSpeed - Config.Stress.speedStress.threshold))
                        stressChange = stressChange + (Config.Stress.speedStress.gainRate * speedPercent * Config.Stress.gainMultiplier)
                    end
                end
            end
            
            -- Low health stress
            if Config.Stress.lowHealthStress.enabled then
                local health = GetEntityHealth(ped)
                local maxHealth = GetEntityMaxHealth(ped)
                local healthPercent = ((health - 100) / (maxHealth - 100)) * 100
                if healthPercent < Config.Stress.lowHealthStress.threshold then
                    stressChange = stressChange + (Config.Stress.lowHealthStress.gainRate * Config.Stress.gainMultiplier)
                end
            end
            
            -- Natural stress relief (when safe)
            if stressChange == 0 then
                local vehicle = GetVehiclePedIsIn(ped, false)
                if vehicle == 0 and not IsPedRunning(ped) and not IsPedSprinting(ped) then
                    -- Calm relief (standing/walking)
                    if Config.Stress.calmRelief.enabled then
                        stressChange = stressChange - (Config.Stress.calmRelief.rate * Config.Stress.reliefMultiplier)
                    end
                else
                    -- Natural relief (idle)
                    if Config.Stress.naturalRelief.enabled then
                        stressChange = stressChange - (Config.Stress.naturalRelief.rate * Config.Stress.reliefMultiplier)
                    end
                end
            end
            
            -- Apply stress change
            if stressChange ~= 0 then
                local newStress = stress + stressChange
                SetFrameworkStress(newStress)
            end
        end
    end
end)

-- Shooting stress
CreateThread(function()
    while true do
        Wait(0)
        
        if Config.Stress.enabled and Config.StatusBars.stress.enabled and Config.Stress.shootingStress.enabled and hudActive then
            local ped = PlayerPedId()
            if IsPedShooting(ped) then
                local currentTime = GetGameTimer()
                if currentTime - lastShootTime > Config.Stress.shootingStress.cooldown then
                    lastShootTime = currentTime
                    local stress = GetFrameworkStress()
                    SetFrameworkStress(stress + (Config.Stress.shootingStress.gainPerShot * Config.Stress.gainMultiplier))
                end
            end
        else
            Wait(100)
        end
    end
end)

-- Being shot stress
CreateThread(function()
    while true do
        Wait(100)
        
        if Config.Stress.enabled and Config.StatusBars.stress.enabled and Config.Stress.beingShotStress.enabled and hudActive then
            local ped = PlayerPedId()
            if HasEntityBeenDamagedByAnyPed(ped) then
                local currentTime = GetGameTimer()
                if currentTime - lastHitTime > Config.Stress.beingShotStress.cooldown then
                    lastHitTime = currentTime
                    local stress = GetFrameworkStress()
                    SetFrameworkStress(stress + (Config.Stress.beingShotStress.gainPerHit * Config.Stress.gainMultiplier))
                    ClearEntityLastDamageEntity(ped)
                end
            end
        end
    end
end)

-- Update HUD - Optimized health tracking
CreateThread(function()
    while true do
        Wait(250) -- Update every 250ms (reduced from 100ms for better performance)
        
        if hudActive then
            local ped = PlayerPedId()
            local health = GetEntityHealth(ped)
            local maxHealth = GetEntityMaxHealth(ped)
            local armor = GetPedArmour(ped)
            
            -- Calculate health percentage (200 max health = 100%)
            local healthPercent = math.floor(((health - 100) / (maxHealth - 100)) * 100)
            healthPercent = math.max(0, math.min(100, healthPercent))
            
            -- Check if underwater
            local underwater = IsPedSwimmingUnderWater(ped)
            local oxygenLevel = 100
            local showOxygen = false
            
            if underwater then
                -- Underwater oxygen (depletes when underwater)
                oxygenLevel = math.floor(GetPlayerUnderwaterTimeRemaining(PlayerId()) * 10)
                showOxygen = true
            else
                -- On land - track stamina (running exhaustion)
                local staminaRaw = GetPlayerSprintStaminaRemaining(PlayerId())
                
                -- Hide oxygen bar when stamina is full
                if staminaRaw <= 0.5 then
                    oxygenLevel = 100
                    showOxygen = false
                else
                    local staminaPercent = math.max(0, math.min(100, 100 - staminaRaw))
                    oxygenLevel = math.floor(staminaPercent)
                    showOxygen = true
                end
            end
            
            -- Framework-specific status fetching
            if FrameworkName == "ESX" then
                -- ESX uses esx_status
                TriggerEvent('esx_status:getStatus', 'hunger', function(hunger)
                    TriggerEvent('esx_status:getStatus', 'thirst', function(thirst)
                        local stressLevel = GetFrameworkStress()
                        
                        SendNUIMessage({
                            action = 'updateHUD',
                            data = {
                                data = {
                                    health = healthPercent,
                                    armor = armor,
                                    hunger = hunger and math.floor(hunger.getPercent()) or 100,
                                    thirst = thirst and math.floor(thirst.getPercent()) or 100,
                                    stamina = 100 - GetPlayerSprintStaminaRemaining(PlayerId()),
                                    oxygen = oxygenLevel,
                                    stress = stressLevel,
                                    underwater = underwater,
                                    showOxygen = showOxygen
                                }
                            }
                        })
                    end)
                end)
            elseif FrameworkName == "QBCore" or FrameworkName == "QBox" then
                -- QBCore/QBox uses player metadata
                local PlayerData = Framework.Functions.GetPlayerData()
                local hunger = 100
                local thirst = 100
                
                if PlayerData and PlayerData.metadata then
                    hunger = PlayerData.metadata.hunger or 100
                    thirst = PlayerData.metadata.thirst or 100
                end
                
                local stressLevel = GetFrameworkStress()
                
                SendNUIMessage({
                    action = 'updateHUD',
                    data = {
                        data = {
                            health = healthPercent,
                            armor = armor,
                            hunger = math.floor(hunger),
                            thirst = math.floor(thirst),
                            stamina = 100 - GetPlayerSprintStaminaRemaining(PlayerId()),
                            oxygen = oxygenLevel,
                            stress = stressLevel,
                            underwater = underwater,
                            showOxygen = showOxygen
                        }
                    }
                })
            else
                -- Standalone - basic stats only
                SendNUIMessage({
                    action = 'updateHUD',
                    data = {
                        data = {
                            health = healthPercent,
                            armor = armor,
                            hunger = 100,
                            thirst = 100,
                            stamina = 100 - GetPlayerSprintStaminaRemaining(PlayerId()),
                            oxygen = oxygenLevel,
                            stress = 0,
                            underwater = underwater,
                            showOxygen = showOxygen
                        }
                    }
                })
            end
        end
    end
end)

-- Seatbelt system - CLIENT-SIDE ONLY (each player manages their own seatbelt)
local seatbeltOn = false
local lastSpeed = 0
local seatbeltAlarmPlaying = false
local lastSeatbeltState = false
local seatbeltSoundCooldown = 0
local lastWasInVehicle = false
local lastVehicle = 0
local seatChangeTimer = 0

-- Seatbelt command (only if enabled in config)
if Config.Seatbelt.enabled then
    RegisterCommand('seatbelt', function()
        local ped = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(ped, false)
        
        -- Only allow seatbelt toggle if player is in a vehicle (any seat)
        if vehicle ~= 0 then
            local currentTime = GetGameTimer()
            
            -- Prevent spam (200ms cooldown)
            if currentTime - seatbeltSoundCooldown < 200 then
                return
            end
            
            seatbeltOn = not seatbeltOn
            seatbeltSoundCooldown = currentTime
            
            if seatbeltOn then
                ShowCustomNotification('success', 'Seatbelt', '✅ Seatbelt fastened')
                -- Stop alarm immediately when seatbelt is put on
                if seatbeltAlarmPlaying then
                    seatbeltAlarmPlaying = false
                end
            else
                ShowCustomNotification('error', 'Seatbelt', '⚠️ Seatbelt unfastened')
            end
            
            -- Send seatbelt state to NUI for sound management
            SendNUIMessage({
                action = 'updateVehicle',
                data = {
                    data = {
                        seatbelt = seatbeltOn,
                        inVehicle = true,
                        speed = math.floor(GetEntitySpeed(vehicle) * 3.6)
                    }
                }
            })
        end
    end, false)

    -- Bind seatbelt key
    RegisterKeyMapping('seatbelt', 'Toggle Seatbelt', 'keyboard', Config.Seatbelt.key)
end

-- Boat Anchor System
local boatAnchorActive = false

-- Aircraft altitude tracking for vertical speed calculation
local lastAltitude = nil
local lastAltitudeTime = nil
local lastWasAircraft = false

-- Function to check if vehicle is a boat
local function IsVehicleBoat(vehicle)
    local vehicleClass = GetVehicleClass(vehicle)
    return vehicleClass == 14 -- 14 = Boats
end

-- Function to toggle boat anchor
local function ToggleBoatAnchor()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle == 0 then return end
    if not IsVehicleBoat(vehicle) then return end
    if GetPedInVehicleSeat(vehicle, -1) ~= ped then return end -- Driver only
    
    boatAnchorActive = not boatAnchorActive
    
    if boatAnchorActive then
        -- Anchor down - reduce speed but don't freeze
        SetVehicleForwardSpeed(vehicle, 0.0)
        ShowCustomNotification('success', 'Anchor', '⚓ Anchor dropped')
    else
        -- Anchor up
        ShowCustomNotification('success', 'Anchor', '⚓ Anchor raised')
    end
end

-- Register boat anchor keybind (only if config is set)
if Config.BoatAnchorKeybind and Config.BoatAnchorKeybind ~= false then
    RegisterCommand('+boatanchor', function()
        ToggleBoatAnchor()
    end, false)
    RegisterCommand('-boatanchor', function() end, false)
    RegisterKeyMapping('+boatanchor', 'Toggle Boat Anchor', 'keyboard', Config.BoatAnchorKeybind)
end

-- Vehicle HUD with full data - Works for DRIVER AND ALL PASSENGERS
CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local vehicle = GetVehiclePedIsIn(ped, false)
        
        -- Check if player is in ANY seat (driver or passenger)
        if vehicle ~= 0 then
            Wait(100) -- Update every 100ms when in vehicle
            
            -- Check if player is the driver
            local isDriver = GetPedInVehicleSeat(vehicle, -1) == ped
            
            -- Debug: Print once when entering vehicle
            if not lastWasInVehicle then
                local seatIndex = -2
                for i = -1, GetVehicleMaxNumberOfPassengers(vehicle) - 1 do
                    if GetPedInVehicleSeat(vehicle, i) == ped then
                        seatIndex = i
                        break
                    end
                end
                -- Player entered vehicle
                lastWasInVehicle = true
            end
            
            -- Get vehicle speed (ensure it's a number with fallback)
            local speed = GetEntitySpeed(vehicle)
            if not speed or type(speed) ~= 'number' then speed = 0 end
            local speedKmh = math.floor(speed * 3.6 + 0.5) -- Round properly
            local speedMph = math.floor(speed * 2.236936 + 0.5)
            
            -- Get fuel level with fallback (supports multiple fuel systems)
            -- Native GTA V fuel system tracks fuel per vehicle automatically
            local fuel = 0
            
            if Config.FuelSystem == "native" then
                -- Use native GTA V fuel system (default)
                -- This automatically tracks fuel per vehicle (by entity/plate)
                fuel = GetVehicleFuelLevel(vehicle) or 0
            elseif Config.FuelSystem == "ox_fuel" then
                fuel = GetVehicleFuelLevel(vehicle) or 0
            elseif Config.FuelSystem == "LegacyFuel" then
                fuel = exports['LegacyFuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "lc_fuel" then
                fuel = exports['lc_fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "ps-fuel" then
                fuel = exports['ps-fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "lj-fuel" then
                fuel = exports['lj-fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "cdn-fuel" then
                fuel = exports['cdn-fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "hyon_gas_station" then
                fuel = exports['hyon_gas_station']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "okokGasStation" then
                fuel = exports['okokGasStation']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "nd_fuel" then
                fuel = exports['nd_fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "myFuel" then
                fuel = exports['myFuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "ti_fuel" then
                fuel = exports['ti_fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "Renewed-Fuel" then
                fuel = exports['Renewed-Fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "rcore_fuel" then
                fuel = exports['rcore_fuel']:GetFuel(vehicle) or 0
            elseif Config.FuelSystem == "none" then
                -- No fuel system - always show full
                fuel = 100
            else
                -- Fallback to native if config is invalid
                fuel = GetVehicleFuelLevel(vehicle) or 0
            end
            
            -- Ensure fuel is a valid number between 0-100
            if not fuel or type(fuel) ~= 'number' then fuel = 0 end
            fuel = math.max(0, math.min(100, math.floor(fuel + 0.5)))
            
            -- Get RPM with fallback
            local rpm = GetVehicleCurrentRpm(vehicle)
            if not rpm or type(rpm) ~= 'number' then rpm = 0 end
            
            -- Get gear with fallback
            local gear = GetVehicleCurrentGear(vehicle)
            if not gear or type(gear) ~= 'number' then gear = 0 end
            
            -- Get engine health with fallback
            local engineHealth = GetVehicleEngineHealth(vehicle)
            if not engineHealth or type(engineHealth) ~= 'number' then engineHealth = 1000 end
            engineHealth = math.floor(engineHealth / 10 + 0.5)
            
            -- Check if vehicle is a boat
            local isBoat = IsVehicleBoat(vehicle)
            
            -- Check if vehicle is an aircraft (separate helicopter and plane)
            local vehicleModel = GetEntityModel(vehicle)
            local isHelicopter = IsThisModelAHeli(vehicleModel)
            local isPlane = IsThisModelAPlane(vehicleModel)
            local isAircraft = isHelicopter or isPlane
            
            -- Debug: Print when entering aircraft
            if isAircraft and not lastWasAircraft then
                if isHelicopter then
                    -- print('[HUD] Entered helicopter - Model: ' .. vehicleModel)
                else
                    -- print('[HUD] Entered plane - Model: ' .. vehicleModel)
                end
                lastWasAircraft = true
            elseif not isAircraft and lastWasAircraft then
                lastWasAircraft = false
            end
            
            -- Get vehicle indicators
            local leftIndicator = GetVehicleIndicatorLights(vehicle) == 1 or GetVehicleIndicatorLights(vehicle) == 3
            local rightIndicator = GetVehicleIndicatorLights(vehicle) == 2 or GetVehicleIndicatorLights(vehicle) == 3
            local hazard = GetVehicleIndicatorLights(vehicle) == 3
            
            -- Get lights
            local lightsState, lightsOn, highbeamsOn = GetVehicleLightsState(vehicle)
            lightsOn = lightsOn == 1
            highbeamsOn = highbeamsOn == 1
            
            -- Engine status
            local engineOn = GetIsVehicleEngineRunning(vehicle)
            
            -- Check if driver door is open
            local doorOpen = GetVehicleDoorAngleRatio(vehicle, 0) > 0.0 -- Door 0 is driver door
            
            -- Calculate odometer (simplified - would need persistent storage for real odometer)
            local odometer = math.floor(GetVehicleEstimatedMaxSpeed(vehicle) * 1000)
            
            -- Apply anchor physics for boats
            if isBoat and boatAnchorActive then
                -- Slow down the boat gradually but allow wave motion
                local currentSpeed = GetEntitySpeed(vehicle)
                if currentSpeed > 0.5 then
                    SetVehicleForwardSpeed(vehicle, currentSpeed * 0.9) -- Gradual slowdown
                end
                -- Don't freeze - let physics handle wave motion
            end
            
            -- Get boat-specific data
            local waveHeight = 0.0
            local waterDepth = 0.0
            local compassHeading = 0.0
            
            -- Get aircraft-specific data
            local altitude = 0.0
            local heading = 0.0
            local pitch = 0.0
            local roll = 0.0
            local verticalSpeed = 0.0
            local gearDown = false
            
            if isAircraft then
                -- Check actual landing gear position
                local gearPosition = GetVehicleLandingGear(vehicle) or 0
                gearDown = (gearPosition < 0.5)
                
                local coords = GetEntityCoords(vehicle)
                local rotation = GetEntityRotation(vehicle, 2)
                
                -- Get altitude in feet (convert from meters) - IMPROVED CALCULATION
                local groundZ = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z + 500.0, false)
                
                -- If ground detection fails, use entity height above ground as fallback
                if not groundZ or groundZ == 0 then
                    local heightAboveGround = GetEntityHeightAboveGround(vehicle)
                    altitude = math.max(1, math.floor(heightAboveGround * 3.28084 + 0.5)) -- Convert meters to feet, minimum 1
                else
                    altitude = math.max(1, math.floor((coords.z - groundZ) * 3.28084 + 0.5)) -- Convert meters to feet, minimum 1
                end
                
                -- Ensure altitude never shows as 0 when flying
                if altitude < 1 then
                    altitude = 1
                end
                
                -- Get heading (0-360)
                heading = math.floor(GetEntityHeading(vehicle) + 0.5)
                
                -- Get pitch and roll from rotation
                pitch = math.floor(rotation.x * 10 + 0.5) / 10
                roll = math.floor(rotation.y * 10 + 0.5) / 10
                
                -- Calculate vertical speed (feet per minute)
                if lastAltitude and lastAltitudeTime then
                    local altitudeDiff = altitude - lastAltitude
                    local timeDiff = (GetGameTimer() - lastAltitudeTime) / 1000.0 -- Convert to seconds
                    if timeDiff > 0 and timeDiff < 2.0 then -- Only calculate if time diff is reasonable
                        verticalSpeed = math.floor((altitudeDiff / timeDiff) * 60.0 + 0.5) -- Convert to feet per minute
                    end
                else
                    verticalSpeed = 0
                end
                lastAltitude = altitude
                lastAltitudeTime = GetGameTimer()
            else
                -- Reset aircraft data when not in aircraft
                altitude = 0
                heading = 0
                pitch = 0
                roll = 0
                verticalSpeed = 0
                gearDown = false
                lastAltitude = nil
                lastAltitudeTime = nil
            end
            
            if isBoat then
                local coords = GetEntityCoords(vehicle)
                
                -- Get wave height (simulated based on speed and weather)
                local weather = GetPrevWeatherTypeHashName()
                local baseWave = 0.3
                if weather == `RAIN` or weather == `THUNDER` then
                    baseWave = 1.2
                elseif weather == `CLEARING` or weather == `CLOUDS` then
                    baseWave = 0.6
                end
                -- Add some variation based on speed
                waveHeight = math.floor((baseWave + (speedKmh / 200.0)) * 10 + 0.5) / 10
                
                -- Get water depth
                local waterSurfaceZ = TestVerticalProbeAgainstAllWater(coords.x, coords.y, coords.z, 0, 0.0)
                
                if waterSurfaceZ and waterSurfaceZ ~= 0 then
                    local groundZ = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z, false) or waterSurfaceZ
                    
                    if groundZ < waterSurfaceZ then
                        waterDepth = math.floor(math.abs(waterSurfaceZ - groundZ) + 0.5)
                    else
                        waterDepth = math.floor(15.0 + (math.random() * 35.0) + 0.5)
                    end
                else
                    waterDepth = 20
                end
                
                -- Get compass heading
                compassHeading = math.floor(GetEntityHeading(vehicle) + 0.5)
            else
                -- Reset boat data when not in boat
                waveHeight = 0
                waterDepth = 0
                compassHeading = 0
            end
            
            -- Send data to NUI (always send real-time data for ALL players in vehicle)
            -- This works for driver AND all passengers
            local vehicleData = {
                inVehicle = true,
                speed = speedKmh,
                fuel = fuel,
                rpm = math.floor(rpm * 100),
                gear = gear,
                engineHealth = engineHealth,
                odometer = odometer,
                engineOn = engineOn,
                lights = lightsOn,
                highbeams = highbeamsOn,
                doorOpen = doorOpen,
                isBoat = isBoat,
                anchor = boatAnchorActive,
                waveHeight = waveHeight,
                waterDepth = waterDepth,
                compassHeading = compassHeading,
                isAircraft = isAircraft,
                isHelicopter = isHelicopter,
                isPlane = isPlane,
                altitude = altitude,
                heading = heading,
                pitch = pitch,
                roll = roll,
                verticalSpeed = verticalSpeed,
                gearDown = gearDown,
                indicators = {
                    left = leftIndicator,
                    right = rightIndicator,
                    hazard = hazard
                }
            }
            
            -- Only include seatbelt data if seatbelt system is enabled
            if Config.Seatbelt.enabled then
                vehicleData.seatbelt = seatbeltOn
            end
            
            SendNUIMessage({
                action = 'updateVehicle',
                data = {
                    data = vehicleData
                }
            })
            
            -- Seatbelt alarm system - CLIENT-SIDE ONLY (each player hears their own alarm)
            -- ONLY when seatbelt is enabled in config AND in vehicle, engine on, and moving above 5 km/h
            if Config.Seatbelt.enabled then
                if engineOn and speedKmh > 5 then
                    if not seatbeltOn then
                        -- Seatbelt is OFF and vehicle is moving - alarm should be active
                        if not seatbeltAlarmPlaying then
                            seatbeltAlarmPlaying = true
                            -- print('[HUD] Seatbelt alarm started - seatbelt OFF, speed: ' .. speedKmh .. ' km/h')
                        end
                    else
                        -- Seatbelt is ON - stop alarm immediately
                        if seatbeltAlarmPlaying then
                            seatbeltAlarmPlaying = false
                            -- print('[HUD] Seatbelt alarm stopped - seatbelt ON')
                        end
                    end
                else
                    -- Engine off or vehicle stopped (<=5 km/h) - ALWAYS stop alarm
                    if seatbeltAlarmPlaying then
                        seatbeltAlarmPlaying = false
                        -- print('[HUD] Seatbelt alarm stopped - engine off or vehicle stopped')
                    end
                end
            else
                -- Seatbelt system disabled - ensure alarm is always off
                if seatbeltAlarmPlaying then
                    seatbeltAlarmPlaying = false
                end
            end
            
            -- Seatbelt ejection on impact - ONLY if seatbelt is OFF
            if Config.Seatbelt.enabled and Config.Seatbelt.ejectOnImpact and not seatbeltOn then
                if speedMph > Config.Seatbelt.ejectSpeed then
                    local currentSpeed = speedMph
                    -- Check for sudden deceleration (crash)
                    if lastSpeed > 0 and (lastSpeed - currentSpeed) > 30 then
                        -- REALISTIC EJECTION with proper physics
                        local vehicleVelocity = GetEntityVelocity(vehicle)
                        local vehicleForward = GetEntityForwardVector(vehicle)
                        
                        -- Calculate ejection force based on speed difference (impact force)
                        local impactForce = (lastSpeed - currentSpeed) / 10.0 -- Scale down for realism
                        
                        -- Eject player through windshield (forward and up)
                        local ejectX = vehicleForward.x * impactForce * 1.5 -- Forward momentum
                        local ejectY = vehicleForward.y * impactForce * 1.5
                        local ejectZ = math.abs(impactForce) * 0.8 -- Upward force (always positive)
                        
                        -- Add vehicle's current velocity for realistic physics
                        local finalVelocityX = vehicleVelocity.x + ejectX
                        local finalVelocityY = vehicleVelocity.y + ejectY
                        local finalVelocityZ = vehicleVelocity.z + ejectZ
                        
                        -- Position player slightly in front and above vehicle (through windshield)
                        local ejectOffset = GetOffsetFromEntityInWorldCoords(vehicle, 0.0, 2.0, 1.0)
                        SetEntityCoords(ped, ejectOffset.x, ejectOffset.y, ejectOffset.z, false, false, false, false)
                        
                        -- Wait a frame for position to update
                        Wait(0)
                        
                        -- Apply realistic velocity (forward + upward momentum)
                        SetEntityVelocity(ped, finalVelocityX, finalVelocityY, finalVelocityZ)
                        
                        -- Ragdoll for realistic tumbling (longer duration for high-speed crashes)
                        local ragdollTime = math.min(5000, 1000 + (impactForce * 200)) -- 1-5 seconds based on impact
                        SetPedToRagdoll(ped, ragdollTime, ragdollTime, 0, true, true, false)
                        
                        -- Apply damage based on impact severity
                        local damageAmount = math.min(50, impactForce * 3) -- Max 50 damage
                        ApplyDamageToPed(ped, damageAmount, false)
                    end
                    lastSpeed = currentSpeed
                else
                    lastSpeed = speedMph
                end
            else
                -- Seatbelt is ON or ejection disabled - just track speed
                lastSpeed = speedMph
            end
        else
            -- Player NOT in vehicle currently
            -- Wait a moment before resetting - player might be changing seats
            Wait(100)
            
            -- Check again after wait
            local checkVehicle = GetVehiclePedIsIn(PlayerPedId(), false)
            
            if checkVehicle == 0 then
                -- Still not in vehicle after wait - player might be exiting
                Wait(400) -- Additional wait to be sure
                
                -- Final check
                checkVehicle = GetVehiclePedIsIn(PlayerPedId(), false)
                
                if checkVehicle == 0 then
                    -- Confirmed: Player exited vehicle
                    
                    -- Debug: Print once when exiting vehicle
                    if lastWasInVehicle then
                        -- Player exited vehicle
                        lastWasInVehicle = false
                    end
                    
                    -- Reset seatbelt state ONLY when actually exiting vehicle (and only if seatbelt system is enabled)
                    if Config.Seatbelt.enabled then
                        seatbeltOn = false
                        
                        -- Stop seatbelt alarm when exiting vehicle
                        if seatbeltAlarmPlaying then
                            seatbeltAlarmPlaying = false
                        end
                    end
                    
                    boatAnchorActive = false
                    lastSpeed = 0
                    lastAltitude = nil
                    lastAltitudeTime = nil
                    lastWasAircraft = false
                    lastVehicle = 0
                    
                    -- Clear all vehicle data
                    SendNUIMessage({
                        action = 'updateVehicle',
                        data = {
                            data = {
                                inVehicle = false,
                                isBoat = false,
                                isAircraft = false,
                                speed = 0,
                                fuel = 0,
                                rpm = 0,
                                gear = 0,
                                engineHealth = 0,
                                altitude = 0,
                                heading = 0,
                                pitch = 0,
                                roll = 0,
                                verticalSpeed = 0,
                                waveHeight = 0,
                                waterDepth = 0,
                                compassHeading = 0
                            }
                        }
                    })
                else
                    -- Player is back in vehicle - was just changing seats
                    Wait(10) -- Small wait before next check
                end
            else
                -- Player is in vehicle - was just changing seats
                Wait(10) -- Small wait before next check
            end
        end
    end
end)

-- Location HUD with direction - Optimized
CreateThread(function()
    while true do
        Wait(1000) -- Update every 1 second (reduced from 500ms)
        
        local ped = PlayerPedId()
        local coords = GetEntityCoords(ped)
        local heading = GetEntityHeading(ped)
        local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
        local streetName = GetStreetNameFromHashKey(streetHash)
        local zoneName = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
        
        -- Calculate direction from heading
        local direction = 'N'
        if heading >= 337.5 or heading < 22.5 then
            direction = 'N'
        elseif heading >= 22.5 and heading < 67.5 then
            direction = 'NE'
        elseif heading >= 67.5 and heading < 112.5 then
            direction = 'E'
        elseif heading >= 112.5 and heading < 157.5 then
            direction = 'SE'
        elseif heading >= 157.5 and heading < 202.5 then
            direction = 'S'
        elseif heading >= 202.5 and heading < 247.5 then
            direction = 'SW'
        elseif heading >= 247.5 and heading < 292.5 then
            direction = 'W'
        elseif heading >= 292.5 and heading < 337.5 then
            direction = 'NW'
        end
        
        SendNUIMessage({
            action = 'updateLocation',
            data = {
                data = {
                    street = streetName,
                    zone = zoneName,
                    direction = direction
                }
            }
        })
    end
end)

-- Player Info (Server ID, Job) - Optimized
CreateThread(function()
    while true do
        Wait(10000) -- Update every 10 seconds (reduced from 5 seconds)
        
        if playerData and playerData.job then
            local serverId = GetPlayerServerId(PlayerId())
            local jobLabel = playerData.job.label or 'Unemployed'
            local jobGrade = playerData.job.grade_label or ''
            
            SendNUIMessage({
                action = 'updatePlayerInfo',
                data = {
                    serverId = serverId,
                    job = jobLabel .. (jobGrade ~= '' and ' (' .. jobGrade .. ')' or '')
                }
            })
        end
    end
end)

-- ============================================
-- MONEY UPDATE EVENTS (Framework-Agnostic)
-- ============================================

-- ESX Money Update
RegisterNetEvent('esx:setAccountMoney')
AddEventHandler('esx:setAccountMoney', function(account)
    Wait(100)
    UpdateAllPlayerData()
    -- print('[HUD] ESX Money changed - updating display')
end)

-- QBCore/QBox Money Update
RegisterNetEvent('QBCore:Player:SetPlayerData')
AddEventHandler('QBCore:Player:SetPlayerData', function(data)
    if FrameworkName == "QBCore" or FrameworkName == "QBox" then
        Wait(100)
        UpdateAllPlayerData()
        -- print('[HUD] QBCore/QBox Money changed - updating display')
    end
end)

-- Continuous data tracking
CreateThread(function()
    Wait(5000) -- Wait for initial load
    
    while true do
        Wait(2000) -- Update every 2 seconds
        
        if playerData and FrameworkName ~= "standalone" then
            UpdateAllPlayerData()
        end
    end
end)

-- PMA-Voice radio channel tracking
local currentRadioChannel = 0
local lastRadioChannel = 0
local pmaVoiceInitialized = false
local pmaVoiceFailedLogged = false

-- Listen for PMA-Voice radio channel changes (if available)
if GetResourceState('pma-voice') == 'started' then
    -- Register event listener for radio channel changes
    RegisterNetEvent('pma-voice:radioActive')
    AddEventHandler('pma-voice:radioActive', function(radioTalking)
        -- Radio transmission state changed
        -- This event fires when player presses/releases radio key
        -- print('[HUD] Radio transmission state:', radioTalking)
    end)
    
    RegisterNetEvent('pma-voice:setTalkingOnRadio')
    AddEventHandler('pma-voice:setTalkingOnRadio', function(talking)
        -- Radio talking state changed
        -- print('[HUD] Radio talking state:', talking)
    end)
end

-- Voice Indicator with speaking detection and radio support (PMA-Voice State Bags)
-- Voice system - Optimized
CreateThread(function()
    while true do
        Wait(200) -- Update every 200ms (reduced from 100ms)
        
        local voiceMode = 2 -- default normal (1=whisper, 2=normal, 3=shout)
        local isTalking = false
        local radioChannel = 0
        local radioTalking = false
        
        -- Check voice system from config
        if Config.Voice.system == 'pma-voice' and GetResourceState('pma-voice') == 'started' then
            -- Use State Bags to get PMA-Voice data (proper method)
            local plyState = LocalPlayer.state
            
            -- Mark PMA-Voice as successfully initialized
            if not pmaVoiceInitialized then
                pmaVoiceInitialized = true
                -- print('[HUD] PMA-Voice integration initialized successfully (State Bags)')
            end
            
            -- Get proximity (voice mode) from state bag
            local proximity = plyState.proximity
            if proximity and proximity.index then
                voiceMode = proximity.index -- 1=whisper, 2=normal, 3=shout
                -- print('[HUD DEBUG] Proximity Mode:', voiceMode, '(', proximity.mode, ') Distance:', proximity.distance)
            else
                voiceMode = 2 -- Default to normal
            end
            
            -- Get radio channel from state bag
            local radioChannelState = plyState.radioChannel
            if radioChannelState and type(radioChannelState) == 'number' and radioChannelState > 0 then
                radioChannel = math.floor(radioChannelState)
                currentRadioChannel = radioChannel
            else
                radioChannel = 0
                currentRadioChannel = 0
            end
            
            -- Log radio channel changes
            if radioChannel ~= lastRadioChannel then
                if radioChannel > 0 then
                    -- print('[HUD] ✅ Radio CONNECTED to channel: ' .. radioChannel .. ' MHz')
                elseif lastRadioChannel > 0 then
                    -- print('[HUD] ❌ Radio DISCONNECTED')
                end
                lastRadioChannel = radioChannel
            end
            
            -- Check if player is talking (use native detection)
            isTalking = NetworkIsPlayerTalking(PlayerId())
            
            -- Check if talking on radio (state bag)
            local radioTalkingState = plyState.radioTalking
            if radioTalkingState then
                radioTalking = true
                isTalking = true -- Also set general talking to true
            else
                radioTalking = false
            end
            
            -- Debug: Print current state
           -- print('[HUD DEBUG] Radio:', radioChannel, '| Mode:', voiceMode, '| Talking:', isTalking, '| RadioTalking:', radioTalking)
            
        elseif Config.Voice.system == 'mumble-voip' then
            -- Mumble-voip detection (basic)
            isTalking = NetworkIsPlayerTalking(PlayerId())
            voiceMode = 2
            
        elseif Config.Voice.system == 'saltychat' and GetResourceState('saltychat') == 'started' then
            -- SaltyChat detection (basic)
            isTalking = NetworkIsPlayerTalking(PlayerId())
            voiceMode = 2
            
        else
            -- Fallback to native GTA voice detection
            isTalking = NetworkIsPlayerTalking(PlayerId())
            voiceMode = 2
        end
        
        -- Send voice data to NUI
        local voicePayload = {
            mode = voiceMode,           -- Voice range: 1=whisper, 2=normal, 3=shout
            talking = isTalking,        -- Is player talking (voice or radio)
            radioChannel = radioChannel, -- Radio frequency (0 = not connected)
            radioTalking = radioTalking  -- Is player transmitting on radio
        }
        
        -- Debug: Print what we're sending to NUI
        if radioChannel > 0 then
         --   print('[HUD] 📡 Sending to NUI - Radio:', radioChannel, 'MHz | Mode:', voiceMode, '| Talking:', isTalking)
        end
        
        SendNUIMessage({
            action = 'updateVoice',
            data = {
                data = voicePayload
            }
        })
    end
end)

-- Time Display with config option
CreateThread(function()
    while true do
        Wait(1000)
        
        local timeString = ''
        
        if Config.HUD.useRealTime then
            -- Real world time
            local timestamp = os.date("*t")
            if Config.HUD.timeFormat == '12h' then
                local hour = timestamp.hour
                local ampm = 'AM'
                if hour >= 12 then
                    ampm = 'PM'
                    if hour > 12 then
                        hour = hour - 12
                    end
                end
                if hour == 0 then hour = 12 end
                timeString = string.format('%02d:%02d %s', hour, timestamp.min, ampm)
            else
                timeString = string.format('%02d:%02d', timestamp.hour, timestamp.min)
            end
        else
            -- In-game time
            local hour = GetClockHours()
            local minute = GetClockMinutes()
            
            if Config.HUD.timeFormat == '12h' then
                local ampm = 'AM'
                if hour >= 12 then
                    ampm = 'PM'
                    if hour > 12 then
                        hour = hour - 12
                    end
                end
                if hour == 0 then hour = 12 end
                timeString = string.format('%02d:%02d %s', hour, minute, ampm)
            else
                timeString = string.format('%02d:%02d', hour, minute)
            end
        end
        
        SendNUIMessage({
            action = 'updateTime',
            data = {
                data = {
                    time = timeString
                }
            }
        })
    end
end)

-- Toggle HUD (Config.ToggleHudCommand)
if Config.ToggleHudCommand and Config.HUD.enabled then
    RegisterCommand(Config.ToggleHudCommand, function()
        hudActive = not hudActive
        SendNUIMessage({ action = 'setVisible', data = { visible = hudActive } })
        
        -- Also toggle minimap visibility for full cinematic mode
        if Config.Minimap.enabled then
            DisplayRadar(hudActive)
        end
        
        if hudActive then
            ShowCustomNotification('success', 'HUD', 'HUD enabled')
        else
            ShowCustomNotification('info', 'HUD', 'Cinematic mode enabled')
        end
    end)
end

-- Hide HUD in pause menu
CreateThread(function()
    while true do
        Wait(500)
        if IsPauseMenuActive() and Config.HUD.hideInPauseMenu then
            SendNUIMessage({ action = 'setVisible', data = { visible = false } })
        elseif hudActive then
            SendNUIMessage({ action = 'setVisible', data = { visible = true } })
        end
    end
end)

-- Hide default FiveM HUD (health/armor bars)
-- Hide default HUD - Optimized
CreateThread(function()
    while true do
        Wait(1000) -- Check every second instead of every frame
        
        -- Hide all default HUD components
        HideHudComponentThisFrame(1)  -- Wanted Stars
        HideHudComponentThisFrame(2)  -- Weapon Icon
        HideHudComponentThisFrame(3)  -- Cash
        HideHudComponentThisFrame(4)  -- MP Cash
        HideHudComponentThisFrame(6)  -- Vehicle Name
        HideHudComponentThisFrame(7)  -- Area Name
        HideHudComponentThisFrame(8)  -- Vehicle Class
        HideHudComponentThisFrame(9)  -- Street Name
        HideHudComponentThisFrame(13) -- Cash Change
        HideHudComponentThisFrame(17) -- Save Game
        HideHudComponentThisFrame(20) -- Weapon Stats
        
        -- CRITICAL: Hide default health/armor bars
        HideHudComponentThisFrame(3)  -- MP Cash
        HideHudComponentThisFrame(4)  -- MP Message
        HideHudComponentThisFrame(7)  -- Area Name
        HideHudComponentThisFrame(9)  -- Street Name
    end
end)

-- Minimap Configuration - Load custom textures (only if enabled)
if Config.Minimap.enabled then
    CreateThread(function()
        Wait(2000)
        
        -- Load custom minimap.gfx scaleform
        local minimap = RequestScaleformMovie("minimap")
        while not HasScaleformMovieLoaded(minimap) do
            Wait(100)
        end
        if Config.Debug then print('[HUD] minimap.gfx loaded') end
        
        -- Load custom texture dictionary (minimap_layout.ytd)
        RequestStreamedTextureDict("minimap_layout", false)
        while not HasStreamedTextureDictLoaded("minimap_layout") do
            Wait(100)
        end
        if Config.Debug then print('[HUD] minimap_layout.ytd loaded') end
        
        -- PRE-LOAD ALL THREE MINIMAP TEXTURES AT STARTUP
        -- Load rounded (default)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "minimap_layout", "radarmasksm-rounded")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "minimap_layout", "radarmasksm-rounded")
        if Config.Debug then print('[HUD] Pre-loaded: radarmasksm-rounded') end
        
        -- Load square (pre-cached)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm_square", "minimap_layout", "radarmasksm-square")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g_square", "minimap_layout", "radarmasksm-square")
        if Config.Debug then print('[HUD] Pre-loaded: radarmasksm-square') end
        
        -- Load circular (pre-cached)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm_circular", "minimap_layout", "radarmasksm-circular")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g_circular", "minimap_layout", "radarmasksm-circular")
        if Config.Debug then print('[HUD] Pre-loaded: radarmasksm-circular') end
        
        -- Enable radar
        DisplayRadar(true)
        
        if Config.Debug then print('[HUD] Minimap initialized with all textures pre-loaded (default: ' .. Config.Minimap.shape .. ')') end
    end)
end

-- Function to change minimap texture based on style - SWAP PRE-LOADED TEXTURES
local function ApplyMinimapTexture(style)
    if Config.Debug then print('[HUD] Swapping minimap texture to: ' .. style) end
    
    if style == 'square' then
        -- Swap to square
        RemoveReplaceTexture("platform:/textures/graphics", "radarmasksm")
        RemoveReplaceTexture("platform:/textures/graphics", "radarmask1g")
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "minimap_layout", "radarmasksm-square")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "minimap_layout", "radarmasksm-square")
        if Config.Debug then print('[HUD] Switched to: radarmasksm-square') end
    elseif style == 'circular' then
        -- Swap to circular
        RemoveReplaceTexture("platform:/textures/graphics", "radarmasksm")
        RemoveReplaceTexture("platform:/textures/graphics", "radarmask1g")
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "minimap_layout", "radarmasksm-circular")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "minimap_layout", "radarmasksm-circular")
        -- print('[HUD] Switched to: radarmasksm-circular')
    else
        -- Default to rounded
        RemoveReplaceTexture("platform:/textures/graphics", "radarmasksm")
        RemoveReplaceTexture("platform:/textures/graphics", "radarmask1g")
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "minimap_layout", "radarmasksm-rounded")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "minimap_layout", "radarmasksm-rounded")
        if Config.Debug then print('[HUD] Switched to: radarmasksm-rounded') end
    end
    
    -- Force minimap refresh (only if UpdateRadarZoom is enabled)
    if Config.UpdateRadarZoom then
        SetRadarBigmapEnabled(true, false)
        Wait(10)
        SetRadarBigmapEnabled(false, false)
    end
end

-- Minimap Layouts for different mask types
local MinimapLayouts = {}

MinimapLayouts.square = {
    minimap = { -0.0095, -0.060, 0.15, 0.188888 },
    minimap_mask = { 0.0, -0.072, 0.12, 0.2 },
    minimap_blur = { -0.0355, -0.022, 0.267, 0.272 },
}

MinimapLayouts.rounded = {
    minimap = { -0.0095, -0.060, 0.15, 0.188888 },      -- Moved DOWN (Y: -0.080 to -0.060)
    minimap_mask = { -0.005, -0.072, 0.12, 0.2 },       -- Moved DOWN (Y: -0.092 to -0.072)
    minimap_blur = { -0.0355, -0.022, 0.267, 0.272 },   -- Moved DOWN (Y: -0.042 to -0.022)
}

-- Current minimap style (will be loaded from saved settings, NO DEFAULT)
local currentMinimapStyle = nil
local minimapStyleLoaded = false

-- Custom minimap position (from edit mode)
local customMinimapPosition = nil
local lastAppliedMinimapKey = nil -- prevents log spam when position is unchanged

--[[
    GetMinimapAnchor by glitchdetector (Feb 2018) - battle-tested formula.
    Returns the ACTUAL minimap screen position in 0.0-1.0 fractions,
    accounting for aspect ratio, safe-zone, and resolution.
--]]
local function GetMinimapAnchor()
    local safezone = GetSafeZoneSize()
    local safezone_x = 1.0 / 20.0
    local safezone_y = 1.0 / 20.0
    local aspect_ratio = GetAspectRatio(0)
    local res_x, res_y = GetActiveScreenResolution()
    local xscale = 1.0 / res_x
    local yscale = 1.0 / res_y
    local Minimap = {}
    Minimap.width = xscale * (res_x / (4 * aspect_ratio))
    Minimap.height = yscale * (res_y / 5.674)
    Minimap.left_x = xscale * (res_x * (safezone_x * ((math.abs(safezone - 1.0)) * 10)))
    Minimap.bottom_y = 1.0 - yscale * (res_y * (safezone_y * ((math.abs(safezone - 1.0)) * 10)))
    Minimap.right_x = Minimap.left_x + Minimap.width
    Minimap.top_y = Minimap.bottom_y - Minimap.height
    Minimap.x = Minimap.left_x
    Minimap.y = Minimap.top_y
    Minimap.xunit = xscale
    Minimap.yunit = yscale
    return Minimap
end

-- Convert pixel drag delta to scaleform delta.
-- Uses the anchor-derived ratio: if scaleform sizeX=0.15 produces anchor.width screen fraction,
-- then dScaleform = dScreenFraction * (0.15 / anchor.width)
local function PixelDeltaToScaleform(dPixelX, dPixelY)
    local screenWidth, screenHeight = GetActiveScreenResolution()
    local anchor = GetMinimapAnchor()
    local anchorW = math.max(anchor.width, 0.0001)
    local anchorH = math.max(anchor.height, 0.0001)
    local scaleX = 0.15   / anchorW   -- scaleform units per screen-fraction X
    local scaleY = 0.1889 / anchorH   -- scaleform units per screen-fraction Y
    local dx = (dPixelX  / screenWidth)  * scaleX
    local dy = (dPixelY / screenHeight) * scaleY
    return dx, dy
end

-- Apply a pixel drag delta to all three minimap layout components.
local function ApplyMinimapDelta(layout, dPixelX, dPixelY)
    local dx, dy = PixelDeltaToScaleform(dPixelX, dPixelY)
    SetMinimapComponentPosition('minimap',      'L', 'B',
        layout.minimap[1]      + dx, layout.minimap[2]      + dy, layout.minimap[3],      layout.minimap[4])
    SetMinimapComponentPosition('minimap_mask', 'L', 'B',
        layout.minimap_mask[1] + dx, layout.minimap_mask[2] + dy, layout.minimap_mask[3], layout.minimap_mask[4])
    SetMinimapComponentPosition('minimap_blur', 'L', 'B',
        layout.minimap_blur[1] + dx, layout.minimap_blur[2] + dy, layout.minimap_blur[3], layout.minimap_blur[4])
end

-- Minimap positioning and configuration
CreateThread(function()
    -- WAIT for minimap style to be loaded before starting
    -- print('[HUD] Waiting for minimap style to load...')
    local timeout = 0
    while not minimapStyleLoaded and timeout < 50 do
        Wait(100)
        timeout = timeout + 1
    end
    
    -- If still not loaded, use rounded as fallback
    if not currentMinimapStyle then
        currentMinimapStyle = 'rounded'
        -- print('[HUD] Minimap style not loaded in time, using fallback: rounded')
    else
        -- print('[HUD] Minimap style loaded: ' .. currentMinimapStyle)
    end
    
    while true do
        Wait(500) -- Check every 500ms instead of every frame
        
        -- Force disable bigmap
        SetRadarBigmapEnabled(false, false)
        DisplayRadar(true)
        
        -- Get current layout
        local layout = MinimapLayouts[currentMinimapStyle]
        
        -- Set minimap clip type based on style
        if currentMinimapStyle == 'circular' then
            SetMinimapClipType(1)  -- Circular
        elseif currentMinimapStyle == 'rounded' then
            SetMinimapClipType(0)  -- Rounded corners
        else
            SetMinimapClipType(2)  -- Square
        end
        
        -- Use custom position if available, otherwise use default layout
        if customMinimapPosition then
            local px = customMinimapPosition.x
            local py = customMinimapPosition.y

            -- Compute drag delta vs the ACTUAL anchor position (proven formula)
            local anchor = GetMinimapAnchor()
            local screenW, screenH = GetActiveScreenResolution()
            local defPixelX = math.floor(anchor.x * screenW + 0.5)
            local defPixelY = math.floor(anchor.y * screenH + 0.5)

            local dPixelX = px - defPixelX
            local dPixelY = py - defPixelY

            ApplyMinimapDelta(layout, dPixelX, dPixelY)

            local key = px .. ',' .. py
            if lastAppliedMinimapKey ~= key then
                lastAppliedMinimapKey = key
                print(string.format('[HUD] Minimap: card(%d,%d) anchor(%d,%d) delta(%d,%d) res(%dx%d)',
                    px, py, defPixelX, defPixelY, dPixelX, dPixelY, screenW, screenH))
            end
        else
            -- Position minimap components with default layout
            SetMinimapComponentPosition('minimap',      'L', 'B', layout.minimap[1],      layout.minimap[2],      layout.minimap[3],      layout.minimap[4])
            SetMinimapComponentPosition('minimap_mask', 'L', 'B', layout.minimap_mask[1], layout.minimap_mask[2], layout.minimap_mask[3], layout.minimap_mask[4])
            SetMinimapComponentPosition('minimap_blur', 'L', 'B', layout.minimap_blur[1], layout.minimap_blur[2], layout.minimap_blur[3], layout.minimap_blur[4])
            lastAppliedMinimapKey = nil
        end
        
        -- Zoom level
        SetRadarZoom(1100)
        
        -- Hide north blip
        local northBlip = GetNorthRadarBlip()
        if northBlip ~= 0 then
            SetBlipAlpha(northBlip, 0)
        end
    end
end)

-- NUI Callback to update minimap position from edit mode
RegisterNUICallback('updateMinimapPosition', function(data, cb)
    print('[HUD] >> updateMinimapPosition NUI callback received: ' .. json.encode(data or {}))
    if data and data.x ~= nil and data.y ~= nil then
        local anchor = GetMinimapAnchor()
        local screenW, screenH = GetActiveScreenResolution()
        local defW = math.floor(anchor.width  * screenW + 0.5)
        local defH = math.floor(anchor.height * screenH + 0.5)
        customMinimapPosition = {
            x      = data.x + 0.0,
            y      = data.y + 0.0,
            width  = (data.width  or defW) + 0.0,
            height = (data.height or defH) + 0.0
        }
        
        print(string.format('[HUD] customMinimapPosition set: x=%.1f y=%.1f w=%.1f h=%.1f',
            customMinimapPosition.x, customMinimapPosition.y, customMinimapPosition.width, customMinimapPosition.height))
        
        -- Reload the minimap so blips and map update to the new position
        RefreshMinimap()
        
        -- Save to server for persistence
        TriggerServerEvent('hud:saveMinimapPosition', {
            x      = customMinimapPosition.x,
            y      = customMinimapPosition.y,
            width  = customMinimapPosition.width,
            height = customMinimapPosition.height
        })
        
        cb({ status = 'ok' })
    else
        print('[HUD] ERROR: updateMinimapPosition received invalid data')
        cb({ status = 'error', reason = 'invalid data' })
    end
end)

-- NUI Callback to reset minimap position to default
RegisterNUICallback('resetMinimapPosition', function(data, cb)
    customMinimapPosition = nil
    lastAppliedMinimapKey = nil
    -- Tell server to clear saved position so it won't restore on next login
    TriggerServerEvent('hud:clearMinimapPosition')
    print('[HUD] Minimap position reset to default layout')
    cb('ok')
end)

-- Receive minimap position from server (nil means use default layout)
RegisterNetEvent('hud:receiveMinimapPosition')
AddEventHandler('hud:receiveMinimapPosition', function(position)
    if position and position.x ~= nil and position.y ~= nil then
        local anchor = GetMinimapAnchor()
        local screenW, screenH = GetActiveScreenResolution()
        local defW = math.floor(anchor.width  * screenW + 0.5)
        local defH = math.floor(anchor.height * screenH + 0.5)
        customMinimapPosition = {
            x      = position.x + 0.0,
            y      = position.y + 0.0,
            width  = (position.width  or defW) + 0.0,
            height = (position.height or defH) + 0.0
        }
        print(string.format('[HUD] Minimap position loaded from server: x=%.1f y=%.1f w=%.1f h=%.1f',
            customMinimapPosition.x, customMinimapPosition.y,
            customMinimapPosition.width, customMinimapPosition.height))
    else
        -- No saved position - use default layout (don't set customMinimapPosition)
        customMinimapPosition = nil
        print('[HUD] No saved minimap position - using default layout')
    end
end)

-- NUI Callback to change minimap style from web UI
RegisterNUICallback('updateMinimapStyle', function(data, cb)
    if data and data.minimapStyle and MinimapLayouts[data.minimapStyle] then
        currentMinimapStyle = data.minimapStyle
        -- print('[HUD] Minimap style changed to: ' .. currentMinimapStyle)
        
        -- Apply the texture immediately
        ApplyMinimapTexture(data.minimapStyle)
        
        -- Trigger server event to broadcast to all clients
        TriggerServerEvent('hud:updateMinimapStyle', data.minimapStyle)
        
        cb('ok')
    else
        -- print('[HUD] Invalid minimap style')
        cb('error')
    end
end)

-- Network Event to update minimap style from server
RegisterNetEvent('hud:updateMinimapStyle')
AddEventHandler('hud:updateMinimapStyle', function(minimapStyle)
    if minimapStyle and MinimapLayouts[minimapStyle] then
        currentMinimapStyle = minimapStyle
        -- print('[HUD] Minimap style updated from server: ' .. minimapStyle)
        
        -- Apply the texture immediately
        ApplyMinimapTexture(minimapStyle)
    end
end)

-- Helper to build minimap anchor data for NUI messages
local function BuildAnchorData()
    local anchor = GetMinimapAnchor()
    return {
        x      = anchor.x,
        y      = anchor.y,
        width  = anchor.width,
        height = anchor.height
    }
end

-- Command to change minimap style
RegisterCommand('minimapstyle', function(source, args)
    if args[1] and MinimapLayouts[args[1]] then
        currentMinimapStyle = args[1]
        print('[HUD] Minimap style changed to: ' .. currentMinimapStyle)
        
        -- Apply the texture immediately
        ApplyMinimapTexture(args[1])
    else
        -- print('[HUD] Usage: /minimapstyle [square|rounded|circular]')
        -- print('[HUD] Current style: ' .. currentMinimapStyle)
    end
end, false)

-- Command to toggle minimap
RegisterCommand('toggleminimap', function()
    local isVisible = IsRadarEnabled()
    DisplayRadar(not isVisible)
    print('[HUD] Minimap ' .. (not isVisible and 'enabled' or 'disabled'))
end, false)

-- Debug command to reset minimap
RegisterCommand('minimapreset', function()
    print('[HUD] Resetting minimap...')
    DisplayRadar(false)
    Wait(100)
    DisplayRadar(true)
    SetRadarBigmapEnabled(true, false)
    Wait(50)
    SetRadarBigmapEnabled(false, false)
    print('[HUD] Minimap reset complete')
end, false)

-- Debug command to check data
RegisterCommand('hudtest', function()
    print('[HUD] Testing data send...')
    
    -- Test money
    SendNUIMessage({
        action = 'updateMoney',
        data = {
            data = {
                cash = 5000,
                bank = 100000,
                dirty = 500
            }
        }
    })
    
    -- Test player info
    SendNUIMessage({
        action = 'updatePlayerInfo',
        data = {
            data = {
                serverId = 99,
                job = 'Police Officer (Chief)'
            }
        }
    })
    
    print('[HUD] Test data sent!')
end, false)

-- Manual refresh command
RegisterCommand('hudrefresh', function()
    -- print('[HUD] Manually refreshing all data...')
    UpdateAllPlayerData()
end, false)

-- HUD Edit Menu Commands (Config.OpenSettingsCommand)
if Config.AllowPlayersToEditSettings and Config.OpenSettingsCommand then
    RegisterCommand(Config.OpenSettingsCommand, function()
        if Config.Debug then print('[HUD] Opening HUD Settings Menu...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openEditMenu',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)
    
    -- Alias command
    RegisterCommand('hudsettings', function()
        if Config.Debug then print('[HUD] Opening HUD Settings Menu...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openEditMenu',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)
end

-- PlayerInfo Positioning Mode Command (only if allowed)
if Config.AllowUsersToEditLayout then
    RegisterCommand('playerinfoedit', function()
        if Config.Debug then print('[HUD] Opening PlayerInfo Positioning Mode...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openPlayerInfoPositioning',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)

    -- Alias command
    RegisterCommand('piedit', function()
        if Config.Debug then print('[HUD] Opening PlayerInfo Positioning Mode...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openPlayerInfoPositioning',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)
end

-- Simple Positioning Mode Command - Opens the map positioning edit mode
if Config.AllowUsersToEditLayout then
    RegisterCommand('hudposition', function()
        if Config.Debug then print('[HUD] Opening Simple Positioning Mode...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openSimplePositioning',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)

    -- Alias command
    RegisterCommand('hudpos', function()
        if Config.Debug then print('[HUD] Opening Simple Positioning Mode...') end
        SetNuiFocus(true, true)
        SendNUIMessage({
            action = 'openSimplePositioning',
            data = { minimapAnchor = BuildAnchorData() }
        })
    end, false)
end

--print('[HUD] Client loaded successfully')
--print('[HUD] Commands available: /hudsettings, /hudedit, /playerinfoedit, /piedit, /hud, /hudtest, /hudrefresh')

-- NUI Callbacks for Edit Menu
RegisterNUICallback('closeEditMenu', function(data, cb)
    SetNuiFocus(false, false)
    cb('ok')
end)

-- Client-side debounce timer for save requests
local clientSaveTimer = nil
local pendingSaveData = nil
local CLIENT_SAVE_DEBOUNCE = 2000 -- 2 seconds

RegisterNUICallback('saveHUDSettings', function(data, cb)
    -- Settings are saved in localStorage by React/TypeScript
    -- No need to save to KVP or server
    -- Just acknowledge the callback
    cb('ok')
end)

RegisterNUICallback('closePlayerInfoPositioning', function(data, cb)
   -- print('[HUD] Closing PlayerInfo positioning mode...')
    SetNuiFocus(false, false)
    cb('ok')
end)

-- NUI Callback to set minimap style from web UI on startup
RegisterNUICallback('setMinimapStyle', function(data, cb)
    if data and data.minimapStyle then
        currentMinimapStyle = data.minimapStyle
        minimapStyleLoaded = true
       -- print('[HUD] Minimap style set from NUI: ' .. currentMinimapStyle)
        ApplyMinimapTexture(currentMinimapStyle)
    end
    cb('ok')
end)

-- Receive settings from server (not used - settings are in localStorage)
RegisterNetEvent('hud:receiveSettings')
AddEventHandler('hud:receiveSettings', function(settings)
    -- Not used - settings are managed by React localStorage
end)

-- Weapon Display System - Real-time tracking
local currentWeapon = nil
local currentAmmo = 0
local currentMaxAmmo = 0
local isReloading = false

-- Weapon data mapping (hash to name and label)
local WeaponData = {
    [GetHashKey('WEAPON_UNARMED')] = { name = 'WEAPON_UNARMED', label = 'Unarmed' },
    [GetHashKey('WEAPON_KNIFE')] = { name = 'WEAPON_KNIFE', label = 'Knife' },
    [GetHashKey('WEAPON_NIGHTSTICK')] = { name = 'WEAPON_NIGHTSTICK', label = 'Nightstick' },
    [GetHashKey('WEAPON_HAMMER')] = { name = 'WEAPON_HAMMER', label = 'Hammer' },
    [GetHashKey('WEAPON_BAT')] = { name = 'WEAPON_BAT', label = 'Baseball Bat' },
    [GetHashKey('WEAPON_GOLFCLUB')] = { name = 'WEAPON_GOLFCLUB', label = 'Golf Club' },
    [GetHashKey('WEAPON_CROWBAR')] = { name = 'WEAPON_CROWBAR', label = 'Crowbar' },
    [GetHashKey('WEAPON_PISTOL')] = { name = 'WEAPON_PISTOL', label = 'Pistol' },
    [GetHashKey('WEAPON_COMBATPISTOL')] = { name = 'WEAPON_COMBATPISTOL', label = 'Combat Pistol' },
    [GetHashKey('WEAPON_APPISTOL')] = { name = 'WEAPON_APPISTOL', label = 'AP Pistol' },
    [GetHashKey('WEAPON_PISTOL50')] = { name = 'WEAPON_PISTOL50', label = 'Pistol .50' },
    [GetHashKey('WEAPON_MICROSMG')] = { name = 'WEAPON_MICROSMG', label = 'Micro SMG' },
    [GetHashKey('WEAPON_SMG')] = { name = 'WEAPON_SMG', label = 'SMG' },
    [GetHashKey('WEAPON_ASSAULTSMG')] = { name = 'WEAPON_ASSAULTSMG', label = 'Assault SMG' },
    [GetHashKey('WEAPON_ASSAULTRIFLE')] = { name = 'WEAPON_ASSAULTRIFLE', label = 'Assault Rifle' },
    [GetHashKey('WEAPON_CARBINERIFLE')] = { name = 'WEAPON_CARBINERIFLE', label = 'Carbine Rifle' },
    [GetHashKey('WEAPON_ADVANCEDRIFLE')] = { name = 'WEAPON_ADVANCEDRIFLE', label = 'Advanced Rifle' },
    [GetHashKey('WEAPON_MG')] = { name = 'WEAPON_MG', label = 'MG' },
    [GetHashKey('WEAPON_COMBATMG')] = { name = 'WEAPON_COMBATMG', label = 'Combat MG' },
    [GetHashKey('WEAPON_PUMPSHOTGUN')] = { name = 'WEAPON_PUMPSHOTGUN', label = 'Pump Shotgun' },
    [GetHashKey('WEAPON_SAWNOFFSHOTGUN')] = { name = 'WEAPON_SAWNOFFSHOTGUN', label = 'Sawed-Off Shotgun' },
    [GetHashKey('WEAPON_ASSAULTSHOTGUN')] = { name = 'WEAPON_ASSAULTSHOTGUN', label = 'Assault Shotgun' },
    [GetHashKey('WEAPON_BULLPUPSHOTGUN')] = { name = 'WEAPON_BULLPUPSHOTGUN', label = 'Bullpup Shotgun' },
    [GetHashKey('WEAPON_STUNGUN')] = { name = 'WEAPON_STUNGUN', label = 'Stun Gun' },
    [GetHashKey('WEAPON_SNIPERRIFLE')] = { name = 'WEAPON_SNIPERRIFLE', label = 'Sniper Rifle' },
    [GetHashKey('WEAPON_HEAVYSNIPER')] = { name = 'WEAPON_HEAVYSNIPER', label = 'Heavy Sniper' },
    [GetHashKey('WEAPON_GRENADELAUNCHER')] = { name = 'WEAPON_GRENADELAUNCHER', label = 'Grenade Launcher' },
    [GetHashKey('WEAPON_RPG')] = { name = 'WEAPON_RPG', label = 'RPG' },
    [GetHashKey('WEAPON_MINIGUN')] = { name = 'WEAPON_MINIGUN', label = 'Minigun' },
    [GetHashKey('WEAPON_GRENADE')] = { name = 'WEAPON_GRENADE', label = 'Grenade' },
    [GetHashKey('WEAPON_STICKYBOMB')] = { name = 'WEAPON_STICKYBOMB', label = 'Sticky Bomb' },
    [GetHashKey('WEAPON_SMOKEGRENADE')] = { name = 'WEAPON_SMOKEGRENADE', label = 'Smoke Grenade' },
    [GetHashKey('WEAPON_BZGAS')] = { name = 'WEAPON_BZGAS', label = 'BZ Gas' },
    [GetHashKey('WEAPON_MOLOTOV')] = { name = 'WEAPON_MOLOTOV', label = 'Molotov' },
    [GetHashKey('WEAPON_FIREEXTINGUISHER')] = { name = 'WEAPON_FIREEXTINGUISHER', label = 'Fire Extinguisher' },
    [GetHashKey('WEAPON_PETROLCAN')] = { name = 'WEAPON_PETROLCAN', label = 'Petrol Can' },
    [GetHashKey('WEAPON_SNSPISTOL')] = { name = 'WEAPON_SNSPISTOL', label = 'SNS Pistol' },
    [GetHashKey('WEAPON_SPECIALCARBINE')] = { name = 'WEAPON_SPECIALCARBINE', label = 'Special Carbine' },
    [GetHashKey('WEAPON_HEAVYPISTOL')] = { name = 'WEAPON_HEAVYPISTOL', label = 'Heavy Pistol' },
    [GetHashKey('WEAPON_BULLPUPRIFLE')] = { name = 'WEAPON_BULLPUPRIFLE', label = 'Bullpup Rifle' },
    [GetHashKey('WEAPON_VINTAGEPISTOL')] = { name = 'WEAPON_VINTAGEPISTOL', label = 'Vintage Pistol' },
    [GetHashKey('WEAPON_MUSKET')] = { name = 'WEAPON_MUSKET', label = 'Musket' },
    [GetHashKey('WEAPON_HEAVYSHOTGUN')] = { name = 'WEAPON_HEAVYSHOTGUN', label = 'Heavy Shotgun' },
    [GetHashKey('WEAPON_MARKSMANRIFLE')] = { name = 'WEAPON_MARKSMANRIFLE', label = 'Marksman Rifle' },
    [GetHashKey('WEAPON_HOMINGLAUNCHER')] = { name = 'WEAPON_HOMINGLAUNCHER', label = 'Homing Launcher' },
    [GetHashKey('WEAPON_PROXMINE')] = { name = 'WEAPON_PROXMINE', label = 'Proximity Mine' },
    [GetHashKey('WEAPON_SNOWBALL')] = { name = 'WEAPON_SNOWBALL', label = 'Snowball' },
    [GetHashKey('WEAPON_FLAREGUN')] = { name = 'WEAPON_FLAREGUN', label = 'Flare Gun' },
    [GetHashKey('WEAPON_COMBATPDW')] = { name = 'WEAPON_COMBATPDW', label = 'Combat PDW' },
    [GetHashKey('WEAPON_MARKSMANPISTOL')] = { name = 'WEAPON_MARKSMANPISTOL', label = 'Marksman Pistol' },
    [GetHashKey('WEAPON_KNUCKLE')] = { name = 'WEAPON_KNUCKLE', label = 'Knuckle Duster' },
    [GetHashKey('WEAPON_HATCHET')] = { name = 'WEAPON_HATCHET', label = 'Hatchet' },
    [GetHashKey('WEAPON_RAILGUN')] = { name = 'WEAPON_RAILGUN', label = 'Railgun' },
    [GetHashKey('WEAPON_MACHETE')] = { name = 'WEAPON_MACHETE', label = 'Machete' },
    [GetHashKey('WEAPON_MACHINEPISTOL')] = { name = 'WEAPON_MACHINEPISTOL', label = 'Machine Pistol' },
    [GetHashKey('WEAPON_SWITCHBLADE')] = { name = 'WEAPON_SWITCHBLADE', label = 'Switchblade' },
    [GetHashKey('WEAPON_REVOLVER')] = { name = 'WEAPON_REVOLVER', label = 'Heavy Revolver' },
    [GetHashKey('WEAPON_DBSHOTGUN')] = { name = 'WEAPON_DBSHOTGUN', label = 'Double Barrel Shotgun' },
    [GetHashKey('WEAPON_COMPACTRIFLE')] = { name = 'WEAPON_COMPACTRIFLE', label = 'Compact Rifle' },
    [GetHashKey('WEAPON_AUTOSHOTGUN')] = { name = 'WEAPON_AUTOSHOTGUN', label = 'Auto Shotgun' },
    [GetHashKey('WEAPON_BATTLEAXE')] = { name = 'WEAPON_BATTLEAXE', label = 'Battle Axe' },
    [GetHashKey('WEAPON_COMPACTLAUNCHER')] = { name = 'WEAPON_COMPACTLAUNCHER', label = 'Compact Launcher' },
    [GetHashKey('WEAPON_MINISMG')] = { name = 'WEAPON_MINISMG', label = 'Mini SMG' },
    [GetHashKey('WEAPON_PIPEBOMB')] = { name = 'WEAPON_PIPEBOMB', label = 'Pipe Bomb' },
    [GetHashKey('WEAPON_POOLCUE')] = { name = 'WEAPON_POOLCUE', label = 'Pool Cue' },
    [GetHashKey('WEAPON_WRENCH')] = { name = 'WEAPON_WRENCH', label = 'Wrench' },
    [GetHashKey('WEAPON_FLASHLIGHT')] = { name = 'WEAPON_FLASHLIGHT', label = 'Flashlight' },
}

-- Thread to track weapon changes and ammo - INSTANT UPDATES
-- Weapon display - Optimized
CreateThread(function()
    while true do
        Wait(100) -- Update every 100ms instead of every frame
        
        local ped = PlayerPedId()
        local weaponHash = GetSelectedPedWeapon(ped)
        
        -- Check if player has a weapon equipped (not unarmed)
        if weaponHash ~= GetHashKey('WEAPON_UNARMED') then
            local weaponInfo = WeaponData[weaponHash]
            local weaponName = weaponInfo and weaponInfo.name or 'WEAPON_UNARMED'
            local weaponLabel = weaponInfo and weaponInfo.label or 'Unknown Weapon'
            
            -- Get ammo counts with proper handling
            local success, ammoInClip = GetAmmoInClip(ped, weaponHash)
            if not success then ammoInClip = 0 end
            
            local totalAmmo = GetAmmoInPedWeapon(ped, weaponHash)
            
            -- Calculate reserve ammo (total - current clip)
            local reserveAmmo = totalAmmo - ammoInClip
            
            -- Check if reloading
            local isCurrentlyReloading = IsPedReloading(ped)
            
            -- Send update if anything changed (weapon, ammo, or reload state)
            if currentWeapon ~= weaponHash or currentAmmo ~= ammoInClip or currentMaxAmmo ~= reserveAmmo or isReloading ~= isCurrentlyReloading then
                currentWeapon = weaponHash
                currentAmmo = ammoInClip
                currentMaxAmmo = reserveAmmo
                isReloading = isCurrentlyReloading
                
                SendNUIMessage({
                    action = 'updateWeapon',
                    data = {
                        data = {
                            hasWeapon = true,
                            weaponName = weaponName,
                            weaponLabel = weaponLabel,
                            ammo = ammoInClip,
                            maxAmmo = reserveAmmo,
                            isReloading = isCurrentlyReloading
                        }
                    }
                })
            end
        else
            -- Player is unarmed, hide weapon display
            if currentWeapon ~= nil then
                currentWeapon = nil
                currentAmmo = 0
                currentMaxAmmo = 0
                isReloading = false
                
                SendNUIMessage({
                    action = 'updateWeapon',
                    data = {
                        data = {
                            hasWeapon = false,
                            weaponName = '',
                            weaponLabel = '',
                            ammo = 0,
                            maxAmmo = 0,
                            isReloading = false
                        }
                    }
                })
            end
        end
    end
end)

--print('[HUD] Weapon display system initialized')

-- Debug command to test voice data and radio channel
RegisterCommand('voicetest', function()
    if GetResourceState('pma-voice') == 'started' then
        local success, voiceData = pcall(function()
            return exports['pma-voice']:getVoiceData()
        end)
        
        if success and voiceData then
            -- print('========== PMA-Voice Data ==========')
            -- print('Voice Mode:', voiceData.mode, '(1=Whisper, 2=Normal, 3=Shout)')
            -- print('Talking:', voiceData.talking)
            -- print('Radio Channel:', voiceData.radio or 'Not connected')
            -- print('Radio Channel Alt:', voiceData.radioChannel or 'N/A')
            -- print('Radio Pressed:', voiceData.radioPressed or false)
            -- print('Radio Talking:', voiceData.radioTalking or false)
            -- print('====================================')
            
            local radioInfo = 'Not connected'
            if voiceData.radio and voiceData.radio > 0 then
                radioInfo = voiceData.radio .. ' MHz'
            elseif voiceData.radioChannel and voiceData.radioChannel > 0 then
                radioInfo = voiceData.radioChannel .. ' MHz'
            end
            
            ShowCustomNotification('info', 'Voice Test', 
                'Mode: ' .. (voiceData.mode or 'N/A') .. 
                ' | Radio: ' .. radioInfo .. 
                ' | Talking: ' .. tostring(voiceData.talking or false))
        else
            print('[HUD] Failed to get PMA-Voice data')
            ShowCustomNotification('error', 'Voice Test', 'Failed to get PMA-Voice data')
        end
    else
        print('[HUD] PMA-Voice is not started')
        ShowCustomNotification('error', 'Voice Test', 'PMA-Voice is not running')
    end
end, false)

-- Debug command to manually set radio channel for testing UI
RegisterCommand('voiceradio', function(source, args)
    local channel = tonumber(args[1]) or 0
    
    SendNUIMessage({
        action = 'updateVoice',
        data = {
            data = {
                mode = 2,
                talking = false,
                radioChannel = channel,
                radioTalking = false
            }
        }
    })
    
    if channel > 0 then
        ShowCustomNotification('info', 'Voice Test', 'Radio set to ' .. channel .. ' MHz')
        print('[HUD] Test: Radio channel set to ' .. channel .. ' MHz')
    else
        ShowCustomNotification('info', 'Voice Test', 'Radio disconnected')
        print('[HUD] Test: Radio disconnected')
    end
end, false)

print('[HUD] Voice indicator system initialized')

-- Vehicle Menu System
local vehicleMenuOpen = false

local vehicleState = {
    engineOn = false,
    leftIndicator = false,
    rightIndicator = false,
    hazardLights = false,
    seatbelt = false,
    cruiseControl = false,
    interiorLight = false,
    headlights = 0,
    hood = false,
    trunk = false,
    doorsLocked = false,
    isAircraft = false,
    landingGear = false,
    isBoat = false,
    anchor = false,
    maxSeats = 0,
    doors = {
        frontLeft = false,
        frontRight = false,
        rearLeft = false,
        rearRight = false
    },
    windows = {
        frontLeft = false,
        frontRight = false,
        rearLeft = false,
        rearRight = false
    },
    seats = {}
}

-- Boat anchor state
local boatAnchorActive = false
local anchoredVehicle = nil

-- Function to check if player is driver
local function IsPlayerDriver()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    if vehicle == 0 then return false end
    return GetPedInVehicleSeat(vehicle, -1) == ped
end

-- Function to update vehicle state
local function UpdateVehicleState()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle == 0 then return end
    
    vehicleState.engineOn = GetIsVehicleEngineRunning(vehicle)
    vehicleState.doorsLocked = GetVehicleDoorLockStatus(vehicle) == 2
    
    -- Detect vehicle type
    local vehicleClass = GetVehicleClass(vehicle)
    vehicleState.isAircraft = (vehicleClass == 15 or vehicleClass == 16) -- Helicopters and Planes
    vehicleState.isBoat = (vehicleClass == 14) -- Boats
    
    -- Check landing gear for aircraft (using correct native)
    if vehicleState.isAircraft then
        -- Check if vehicle has retractable landing gear
        local hasRetractableGear = DoesVehicleHaveLandingGear(vehicle)
        if hasRetractableGear then
            -- 0 = deployed, 1 = retracting, 2 = retracted, 3 = deploying, 4 = broken, 5 = unknown
            local gearState = GetLandingGearState(vehicle)
            vehicleState.landingGear = (gearState == 0 or gearState == 3) -- Down if deployed or deploying
            print('[Landing Gear] State: ' .. tostring(gearState) .. ' | Down: ' .. tostring(vehicleState.landingGear))
        else
            vehicleState.landingGear = true -- Fixed gear (always down)
        end
    end
    
    -- Check anchor for boats
    if vehicleState.isBoat then
        vehicleState.anchor = boatAnchorActive and anchoredVehicle == vehicle
    end
    
    -- Check doors
    vehicleState.doors.frontLeft = GetVehicleDoorAngleRatio(vehicle, 0) > 0.0
    vehicleState.doors.frontRight = GetVehicleDoorAngleRatio(vehicle, 1) > 0.0
    vehicleState.doors.rearLeft = GetVehicleDoorAngleRatio(vehicle, 2) > 0.0
    vehicleState.doors.rearRight = GetVehicleDoorAngleRatio(vehicle, 3) > 0.0
    vehicleState.hood = GetVehicleDoorAngleRatio(vehicle, 4) > 0.0
    vehicleState.trunk = GetVehicleDoorAngleRatio(vehicle, 5) > 0.0
    
    -- Check windows
    vehicleState.windows.frontLeft = not IsVehicleWindowIntact(vehicle, 0)
    vehicleState.windows.frontRight = not IsVehicleWindowIntact(vehicle, 1)
    vehicleState.windows.rearLeft = not IsVehicleWindowIntact(vehicle, 2)
    vehicleState.windows.rearRight = not IsVehicleWindowIntact(vehicle, 3)
    
    -- Dynamic seat detection based on vehicle capacity
    local maxSeats = GetVehicleMaxNumberOfPassengers(vehicle) + 1 -- +1 for driver
    vehicleState.maxSeats = maxSeats
    vehicleState.seats = {}
    
    -- GTA V Seat Index Mapping:
    -- -1 = Driver (frontLeft)
    -- 0 = Front Passenger (frontRight)
    -- 1 = Rear Left (rearLeft)
    -- 2 = Rear Right (rearRight)
    -- 3-8 = Additional seats (seat5-seat10)
    
    local seatMapping = {
        [-1] = 'driver',
        [0] = 'frontRight',
        [1] = 'rearLeft',
        [2] = 'rearRight',
        [3] = 'seat5',
        [4] = 'seat6',
        [5] = 'seat7',
        [6] = 'seat8',
        [7] = 'seat9',
        [8] = 'seat10'
    }
    
    -- Check each seat (driver is -1, passengers start at 0)
    for i = -1, maxSeats - 2 do
        local pedInSeat = GetPedInVehicleSeat(vehicle, i)
        local seatKey = seatMapping[i]
        if seatKey then
            -- A seat is occupied if there's a valid ped in it (not -1 and not 0)
            vehicleState.seats[seatKey] = (pedInSeat ~= -1 and pedInSeat ~= 0)
        end
    end
    
    -- Debug logging
    -- print('[Vehicle Menu] Vehicle type: ' .. (vehicleState.isAircraft and 'Aircraft' or vehicleState.isBoat and 'Boat' or 'Vehicle'))
    -- print('[Vehicle Menu] Max seats: ' .. maxSeats)
    -- print('[Vehicle Menu] Seat occupancy:')
    -- for seatName, occupied in pairs(vehicleState.seats) do
    --     print('  ' .. seatName .. ': ' .. tostring(occupied))
    -- end
    
    -- Send to NUI
    SendNUIMessage({
        action = 'updateVehicleState',
        data = vehicleState
    })
end

-- Function to open vehicle menu
local function OpenVehicleMenu()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle == 0 then
        ShowCustomNotification('error', 'Vehicle Menu', 'You must be in a vehicle!')
        return
    end
    
    vehicleMenuOpen = true
    
    -- Request latest seat data from server (OneSync)
    local vehicleNetId = NetworkGetNetworkIdFromEntity(vehicle)
    TriggerServerEvent('hud:requestVehicleSeats', vehicleNetId)
    
    -- Wait a moment for server response
    Citizen.Wait(50)
    
    UpdateVehicleState()
    
    SendNUIMessage({
        action = 'openVehicleMenu',
        data = {
            isDriver = IsPlayerDriver(),
            vehicleState = vehicleState
        }
    })
    
    SetNuiFocus(true, true)
end

-- OneSync: Receive vehicle seat data from server
RegisterNetEvent('hud:receiveVehicleSeats')
AddEventHandler('hud:receiveVehicleSeats', function(vehicleNetId, seats)
    print('[OneSync] Received seat data for vehicle ' .. vehicleNetId)
    
    -- Update vehicle state if menu is open
    if vehicleMenuOpen then
        UpdateVehicleState()
    end
end)

-- OneSync: Sync vehicle seats across all clients
RegisterNetEvent('hud:syncVehicleSeats')
AddEventHandler('hud:syncVehicleSeats', function(vehicleNetId, seats)
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle ~= 0 then
        local currentVehicleNetId = NetworkGetNetworkIdFromEntity(vehicle)
        
        -- Only update if we're in the same vehicle
        if currentVehicleNetId == vehicleNetId and vehicleMenuOpen then
            print('[OneSync] Syncing seats for vehicle ' .. vehicleNetId)
            UpdateVehicleState()
        end
    end
end)

-- Function to close vehicle menu
local function CloseVehicleMenu()
    vehicleMenuOpen = false
    SendNUIMessage({
        action = 'closeVehicleMenu'
    })
    SetNuiFocus(false, false)
end

-- Helper function to toggle left indicator
local function ToggleLeftIndicator()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle ~= 0 and IsPlayerDriver() then
        vehicleState.leftIndicator = not vehicleState.leftIndicator
        vehicleState.rightIndicator = false
        vehicleState.hazardLights = false
        SetVehicleIndicatorLights(vehicle, 1, vehicleState.leftIndicator)
        SetVehicleIndicatorLights(vehicle, 0, false)
        
        -- Update UI if menu is open
        if vehicleMenuOpen then
            UpdateVehicleState()
        end
        
        return true
    end
    return false
end

-- Helper function to toggle right indicator
local function ToggleRightIndicator()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle ~= 0 and IsPlayerDriver() then
        vehicleState.rightIndicator = not vehicleState.rightIndicator
        vehicleState.leftIndicator = false
        vehicleState.hazardLights = false
        SetVehicleIndicatorLights(vehicle, 0, vehicleState.rightIndicator)
        SetVehicleIndicatorLights(vehicle, 1, false)
        
        -- Update UI if menu is open
        if vehicleMenuOpen then
            UpdateVehicleState()
        end
        
        return true
    end
    return false
end

-- Helper function to toggle hazard lights
local function ToggleHazardLights()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle ~= 0 and IsPlayerDriver() then
        vehicleState.hazardLights = not vehicleState.hazardLights
        vehicleState.leftIndicator = false
        vehicleState.rightIndicator = false
        SetVehicleIndicatorLights(vehicle, 0, vehicleState.hazardLights)
        SetVehicleIndicatorLights(vehicle, 1, vehicleState.hazardLights)
        
        -- Update UI if menu is open
        if vehicleMenuOpen then
            UpdateVehicleState()
        end
        
        return true
    end
    return false
end

-- Key mapping for Vehicle Menu (Config.VehicleControlKeybind)
if Config.VehicleControlKeybind then
    RegisterCommand('+vehicleMenu', function()
        local ped = PlayerPedId()
        if IsPedInAnyVehicle(ped, false) then
            -- Check if passenger is allowed to use vehicle control
            local vehicle = GetVehiclePedIsIn(ped, false)
            local isDriver = GetPedInVehicleSeat(vehicle, -1) == ped
            
            if isDriver or Config.AllowPassengersToUseVehicleControl then
                OpenVehicleMenu()
            else
                ShowCustomNotification('error', 'Vehicle Menu', 'Only the driver can access this menu')
            end
        end
    end, false)

    RegisterCommand('-vehicleMenu', function() end, false)

    RegisterKeyMapping('+vehicleMenu', 'Vehicle Menu', 'keyboard', Config.VehicleControlKeybind)
end

-- Keyboard controls for indicators (Config keybinds)
-- Left Indicator
if Config.IndicatorLeftKeybind then
    RegisterCommand('+leftIndicator', function()
        ToggleLeftIndicator()
    end, false)

    RegisterCommand('-leftIndicator', function() end, false)

    RegisterKeyMapping('+leftIndicator', 'Left Indicator', 'keyboard', Config.IndicatorLeftKeybind)
end

-- Right Indicator
if Config.IndicatorRightKeybind then
    RegisterCommand('+rightIndicator', function()
        ToggleRightIndicator()
    end, false)

    RegisterCommand('-rightIndicator', function() end, false)

    RegisterKeyMapping('+rightIndicator', 'Right Indicator', 'keyboard', Config.IndicatorRightKeybind)
end

-- Hazard Lights
if Config.IndicatorHazardsKeybind then
    RegisterCommand('+hazardLights', function()
        ToggleHazardLights()
    end, false)

    RegisterCommand('-hazardLights', function() end, false)

    RegisterKeyMapping('+hazardLights', 'Hazard Lights', 'keyboard', Config.IndicatorHazardsKeybind)
end

-- NUI Callbacks
RegisterNUICallback('closeVehicleMenu', function(data, cb)
    CloseVehicleMenu()
    cb('ok')
end)

RegisterNUICallback('vehicleAction', function(data, cb)
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle == 0 then
        cb('ok')
        return
    end
    
    local action = data.action
    local actionData = data.data
    local isDriver = IsPlayerDriver()
    
    -- Engine toggle (driver only)
    if action == 'toggleEngine' and isDriver then
        local engineOn = GetIsVehicleEngineRunning(vehicle)
        SetVehicleEngineOn(vehicle, not engineOn, false, true)
        vehicleState.engineOn = not engineOn
        
    -- Left indicator (driver only)
    elseif action == 'toggleLeftIndicator' and isDriver then
        ToggleLeftIndicator()
        
    -- Right indicator (driver only)
    elseif action == 'toggleRightIndicator' and isDriver then
        ToggleRightIndicator()
        
    -- Hazard lights (driver only)
    elseif action == 'toggleHazard' and isDriver then
        ToggleHazardLights()
        
    -- Seatbelt (all passengers)
    elseif action == 'toggleSeatbelt' then
        seatbeltOn = not seatbeltOn
        vehicleState.seatbelt = seatbeltOn
        ShowCustomNotification('info', 'Seatbelt', seatbeltOn and '✅ Seatbelt fastened' or '⚠️ Seatbelt unfastened')
        
    -- Hood (driver only)
    elseif action == 'toggleHood' and isDriver then
        if vehicleState.hood then
            SetVehicleDoorShut(vehicle, 4, false)
        else
            SetVehicleDoorOpen(vehicle, 4, false, false)
        end
        vehicleState.hood = not vehicleState.hood
        
    -- Trunk (driver only)
    elseif action == 'toggleTrunk' and isDriver then
        if vehicleState.trunk then
            SetVehicleDoorShut(vehicle, 5, false)
        else
            SetVehicleDoorOpen(vehicle, 5, false, false)
        end
        vehicleState.trunk = not vehicleState.trunk
        
    -- Doors (all passengers)
    elseif action == 'toggleDoor' then
        local doorMap = {
            frontLeft = 0,
            frontRight = 1,
            rearLeft = 2,
            rearRight = 3
        }
        local doorIndex = doorMap[actionData]
        if doorIndex then
            if GetVehicleDoorAngleRatio(vehicle, doorIndex) > 0.0 then
                SetVehicleDoorShut(vehicle, doorIndex, false)
                vehicleState.doors[actionData] = false
            else
                SetVehicleDoorOpen(vehicle, doorIndex, false, false)
                vehicleState.doors[actionData] = true
            end
        end
        
    -- Windows (all passengers)
    elseif action == 'toggleWindow' then
        local windowMap = {
            frontLeft = 0,
            frontRight = 1,
            rearLeft = 2,
            rearRight = 3
        }
        local windowIndex = windowMap[actionData]
        if windowIndex then
            if IsVehicleWindowIntact(vehicle, windowIndex) then
                RollDownWindow(vehicle, windowIndex)
                vehicleState.windows[actionData] = true
            else
                RollUpWindow(vehicle, windowIndex)
                vehicleState.windows[actionData] = false
            end
        end
        
    -- Lock/Unlock (driver only)
    elseif action == 'toggleLock' and isDriver then
        local locked = GetVehicleDoorLockStatus(vehicle) == 2
        SetVehicleDoorsLocked(vehicle, locked and 1 or 2)
        vehicleState.doorsLocked = not locked
        ShowCustomNotification('info', 'Vehicle', vehicleState.doorsLocked and '🔒 Vehicle locked' or '🔓 Vehicle unlocked')
        
    -- Headlights (driver only)
    elseif action == 'cycleHeadlights' and isDriver then
        vehicleState.headlights = (vehicleState.headlights + 1) % 3
        SetVehicleLights(vehicle, vehicleState.headlights)
        
    -- Interior light (all passengers)
    elseif action == 'toggleInteriorLight' then
        vehicleState.interiorLight = not vehicleState.interiorLight
        SetVehicleInteriorlight(vehicle, vehicleState.interiorLight)
        
    -- Cruise control (driver only)
    elseif action == 'toggleCruise' and isDriver then
        vehicleState.cruiseControl = not vehicleState.cruiseControl
        SetVehicleForwardSpeed(vehicle, vehicleState.cruiseControl and GetEntitySpeed(vehicle) or 0.0)
        ShowCustomNotification('info', 'Cruise Control', vehicleState.cruiseControl and 'Cruise control enabled' or 'Cruise control disabled')
        
    -- Landing gear (aircraft only, driver only)
    elseif action == 'toggleLandingGear' and isDriver and vehicleState.isAircraft then
        -- Check if vehicle has retractable landing gear
        if DoesVehicleHaveLandingGear(vehicle) then
            local currentGearState = GetLandingGearState(vehicle)
            local heightAboveGround = GetEntityHeightAboveGround(vehicle)
            local isOnGround = IsVehicleOnAllWheels(vehicle)
            
            print('[Landing Gear] State: ' .. tostring(currentGearState) .. ' | Height: ' .. tostring(heightAboveGround) .. 'm | On ground: ' .. tostring(isOnGround))
            
            -- Custom notification function
            local function ShowNotification(type, title, message)
                SendNUIMessage({
                    action = 'showNotification',
                    data = {
                        type = type,
                        title = title,
                        message = message,
                        duration = 3000
                    }
                })
            end
            
            -- Based on JavaScript example:
            -- States: 0=Deployed, 1=Closing animation, 2=Opening animation, 3=Retracted
            -- ControlLandingGear(veh, 1) = Start closing (retract)
            -- ControlLandingGear(veh, 2) = Start opening (deploy)
            
            if currentGearState == 0 then
                -- Gear is deployed (down), retract it
                if isOnGround or heightAboveGround < 25.0 then
                    ShowNotification('error', 'Landing Gear', 'Cannot retract! Aircraft must be above 25m altitude.')
                    print('[Landing Gear] BLOCKED: Height=' .. tostring(heightAboveGround) .. 'm (need >25m)')
                else
                    -- Start closing animation (like JavaScript: ControlLandingGear(veh, 1))
                    ControlLandingGear(vehicle, 1)
                    ShowNotification('success', 'Landing Gear', 'Landing gear retracting')
                    print('[Landing Gear] RETRACTING: ControlLandingGear(vehicle, 1)')
                end
            elseif currentGearState ~= 0 then
                -- Gear is NOT deployed (up, closing, or opening), deploy it
                -- Start opening animation (like JavaScript: ControlLandingGear(veh, 2))
                ControlLandingGear(vehicle, 2)
                ShowNotification('success', 'Landing Gear', 'Landing gear deploying')
                print('[Landing Gear] DEPLOYING: ControlLandingGear(vehicle, 2)')
            end
        else
            SendNUIMessage({
                action = 'showNotification',
                data = {
                    type = 'info',
                    title = 'Landing Gear',
                    message = 'This aircraft has fixed landing gear',
                    duration = 3000
                }
            })
        end
        
    -- Anchor (boat only, driver only)
    elseif action == 'toggleAnchor' and isDriver and vehicleState.isBoat then
        boatAnchorActive = not boatAnchorActive
        if boatAnchorActive then
            anchoredVehicle = vehicle
            vehicleState.anchor = true
            -- Turn on interior light as anchor indicator
            SetVehicleInteriorlight(vehicle, true)
            ShowCustomNotification('success', 'Anchor', '⚓ Anchor dropped - Boat secured')
        else
            anchoredVehicle = nil
            vehicleState.anchor = false
            -- Turn off interior light when anchor is raised
            SetVehicleInteriorlight(vehicle, false)
            ShowCustomNotification('success', 'Anchor', '⚓ Anchor raised - Boat free')
        end
        
    -- Change seat (all passengers)
    elseif action == 'changeSeat' then
        -- actionData is the seat index directly from UI
        local seatIndex = actionData
        
        if seatIndex then
            -- Get current seat of player
            local currentSeat = -2
            for i = -1, GetVehicleMaxNumberOfPassengers(vehicle) - 1 do
                if GetPedInVehicleSeat(vehicle, i) == ped then
                    currentSeat = i
                    break
                end
            end
            
            -- If player is already in the requested seat, don't do anything
            if currentSeat == seatIndex then
                ShowCustomNotification('info', 'Seat Change', 'You are already in this seat!')
                cb('ok')
                return
            end
            
            -- Check if seat is free
            if IsVehicleSeatFree(vehicle, seatIndex) then
                -- Close menu before changing seat
                CloseVehicleMenu()
                
                -- Wait a frame for menu to close
                Citizen.Wait(100)
                
                -- Change to the seat
                SetPedIntoVehicle(ped, vehicle, seatIndex)
                
                -- Show notification with proper seat names
                local seatNames = {
                    [-1] = 'Driver',
                    [0] = 'Front Passenger',
                    [1] = 'Rear Left',
                    [2] = 'Rear Right',
                    [3] = 'Seat 5',
                    [4] = 'Seat 6',
                    [5] = 'Seat 7',
                    [6] = 'Seat 8',
                    [7] = 'Seat 9',
                    [8] = 'Seat 10'
                }
                local seatName = seatNames[seatIndex] or ('Seat ' .. (seatIndex + 2))
                ShowCustomNotification('success', 'Seat Change', 'Moved to ' .. seatName)
            else
                ShowCustomNotification('error', 'Seat Change', 'This seat is occupied!')
            end
        end
    end
    
    -- Update state
    UpdateVehicleState()
    cb('ok')
end)

-- Update vehicle state periodically when menu is open
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(500)
        if vehicleMenuOpen then
            UpdateVehicleState()
        end
    end
end)

-- Realistic boat anchor system - Prevents movement but allows water physics
-- Boat anchor physics - Optimized
Citizen.CreateThread(function()
    while true do
        if boatAnchorActive and anchoredVehicle and DoesEntityExist(anchoredVehicle) then
            Citizen.Wait(100) -- Update every 100ms when anchor is active
            local ped = PlayerPedId()
            local currentVehicle = GetVehiclePedIsIn(ped, false)
            
            -- Only apply anchor if player is still in the anchored vehicle
            if currentVehicle == anchoredVehicle then
                -- Keep interior light on as anchor indicator
                SetVehicleInteriorlight(anchoredVehicle, true)
                
                -- Prevent forward/backward movement by limiting velocity
                local velocity = GetEntityVelocity(anchoredVehicle)
                local speed = GetEntitySpeed(anchoredVehicle)
                
                -- If boat is trying to move (speed > 0.5), counter it
                if speed > 0.5 then
                    -- Apply counter force to prevent movement
                    SetEntityVelocity(anchoredVehicle, velocity.x * 0.1, velocity.y * 0.1, velocity.z)
                    
                    -- Disable controls to prevent acceleration
                    DisableControlAction(0, 71, true) -- Accelerate
                    DisableControlAction(0, 72, true) -- Brake/Reverse
                end
                
                -- Allow gentle bobbing with waves (keep Z velocity for water physics)
                -- This makes it realistic - boat stays in place but moves with water
            else
                -- Player left the vehicle, deactivate anchor and turn off light
                if anchoredVehicle and DoesEntityExist(anchoredVehicle) then
                    SetVehicleInteriorlight(anchoredVehicle, false)
                end
                boatAnchorActive = false
                anchoredVehicle = nil
            end
        else
            Citizen.Wait(500) -- No anchor active, check less frequently
        end
    end
end)

-- Notification Event Handler - Synced with TSX
RegisterNetEvent('notify:test')
AddEventHandler('notify:test', function(notificationType, title, message, duration)
    -- Validate notification type
    local validTypes = {
        success = true,
        error = true,
        info = true
    }
    
    -- Ensure type is valid
    if not validTypes[notificationType] then
        print('[HUD] ERROR: Invalid notification type: ' .. tostring(notificationType))
        notificationType = 'info'
    end
    
    -- Ensure title is a string
    if type(title) ~= 'string' then
        title = tostring(title or 'Notification')
    end
    
    -- Ensure message is a string
    if type(message) ~= 'string' then
        message = tostring(message or '')
    end
    
    -- Ensure duration is a number and at least 1000ms
    if type(duration) ~= 'number' then
        duration = 3000
    else
        duration = math.max(1000, duration)
    end
    
    -- Send to NUI (TSX)
    SendNUIMessage({
        action = 'showNotification',
        data = {
            type = notificationType,
            title = title,
            message = message,
            duration = duration
        }
    })
    
    -- print('[HUD] Notification Triggered')
    -- print('  Type: ' .. notificationType)
    -- print('  Title: ' .. title)
    -- print('  Message: ' .. message)
    -- print('  Duration: ' .. duration .. 'ms')
end)

print('[HUD] Notification event handler registered - Ready for sync')

-- Progress Bar Test Command
RegisterCommand('testprogress', function(source, args)
    local label = 'Eating Sandwich...'
    local duration = 5000 -- 5 seconds
    local icon = 'mdi-clock-time-four-outline' -- Material Design Icon (Clock outline with hands)
    
    if args[1] then
        label = table.concat(args, ' ')
    end
    
    SendNUIMessage({
        action = 'showProgressBar',
        data = {
            label = label,
            duration = duration,
            icon = icon
        }
    })
    
    print('[HUD] Progress bar started: ' .. label)
end, false)

-- Example usage:
-- /testprogress Eating Sandwich...
-- /testprogress Drinking Water...
-- /testprogress Repairing Vehicle...


-- ============================================
-- NOTIFICATION SYSTEM - TRIGGER EVENTS
-- ============================================

-- Client-side notification trigger
RegisterNetEvent('hud:notify')
AddEventHandler('hud:notify', function(type, title, message, duration)
    -- Validate parameters
    if not type or not title or not message then
        print('[HUD] ERROR: Missing notification parameters')
        return
    end
    
    -- Default duration
    duration = duration or 3000
    
    -- Send to NUI
    SendNUIMessage({
        action = 'showNotification',
        data = {
            type = type,
            title = title,
            message = message,
            duration = duration
        }
    })
    
    print('[HUD] Notification: ' .. type .. ' - ' .. title .. ': ' .. message)
end)

-- Export for other resources
exports('ShowNotification', function(type, title, message, duration)
    TriggerEvent('hud:notify', type, title, message, duration or 3000)
end)

-- ============================================
-- PROGRESS BAR SYSTEM - TRIGGER EVENTS
-- ============================================

local progressBarActive = false

-- Client-side progress bar trigger
RegisterNetEvent('hud:showProgressBar')
AddEventHandler('hud:showProgressBar', function(data)
    -- Validate parameters
    if not data or not data.label then
        print('[HUD] ERROR: Missing progress bar parameters')
        return
    end
    
    -- Prevent multiple progress bars
    if progressBarActive then
        print('[HUD] WARNING: Progress bar already active')
        return
    end
    
    progressBarActive = true
    
    -- Default values
    local label = data.label or 'Processing...'
    local duration = data.duration or 5000
    local icon = data.icon or 'mdi-clock-time-four-outline'
    
    -- Send to NUI
    SendNUIMessage({
        action = 'showProgressBar',
        data = {
            label = label,
            duration = duration,
            icon = icon
        }
    })
    
    print('[HUD] Progress Bar: ' .. label .. ' (' .. duration .. 'ms)')
    
    -- Auto-hide after duration
    Citizen.SetTimeout(duration, function()
        progressBarActive = false
        if data.onComplete then
            data.onComplete()
        end
    end)
end)

-- Hide progress bar manually
RegisterNetEvent('hud:hideProgressBar')
AddEventHandler('hud:hideProgressBar', function()
    SendNUIMessage({
        action = 'hideProgressBar'
    })
    progressBarActive = false
    print('[HUD] Progress bar hidden')
end)

-- Export for other resources
exports('ShowProgressBar', function(label, duration, icon)
    TriggerEvent('hud:showProgressBar', {
        label = label,
        duration = duration or 5000,
        icon = icon or 'mdi-clock-time-four-outline'
    })
end)

-- Export to check if progress bar is active
exports('IsProgressBarActive', function()
    return progressBarActive
end)

-- ============================================
-- TEST COMMANDS
-- ============================================

-- Test notification command
RegisterCommand('testnotify', function()
    TriggerEvent('hud:notify', 'success', 'Test', 'This is a success notification')
    Citizen.Wait(1000)
    TriggerEvent('hud:notify', 'error', 'Test', 'This is an error notification')
    Citizen.Wait(1000)
    TriggerEvent('hud:notify', 'info', 'Test', 'This is an info notification')
end, false)

-- Notification & Progress Bar system loaded


-- Notification & Progress Bar Settings are now integrated into the main HUD Edit Menu
-- Use /hudedit or /hudsettings and navigate to the Notifications or Progress Bar tabs


-- Debug command to check helicopter detection
RegisterCommand('checkhelicopter', function()
    local ped = PlayerPedId()
    local vehicle = GetVehiclePedIsIn(ped, false)
    
    if vehicle ~= 0 then
        local vehicleModel = GetEntityModel(vehicle)
        local isHelicopter = IsThisModelAHeli(vehicleModel)
        local isPlane = IsThisModelAPlane(vehicleModel)
        local isAircraft = isHelicopter or isPlane
        
        print('=== VEHICLE DEBUG ===')
        print('Vehicle Model: ' .. vehicleModel)
        print('Is Helicopter: ' .. tostring(isHelicopter))
        print('Is Plane: ' .. tostring(isPlane))
        print('Is Aircraft: ' .. tostring(isAircraft))
        print('====================')
        
        -- Send notification
        TriggerEvent('hud:notify', 'info', 'Vehicle Check', 
            'Helicopter: ' .. tostring(isHelicopter) .. ' | Plane: ' .. tostring(isPlane))
    else
        print('[HUD] Not in a vehicle')
        TriggerEvent('hud:notify', 'error', 'Vehicle Check', 'Not in a vehicle')
    end
end, false)

print('[HUD] Debug command: /checkhelicopter')

-- NUI Callback for status bar position update
RegisterNUICallback('updateStatusBarPosition', function(data, cb)
    if data and data.x and data.y then
        print('[HUD] Status bar position updated: x=' .. data.x .. ', y=' .. data.y)
        -- Position is already saved in the settings via saveHUDSettings
        -- This callback is just for immediate feedback/logging
    end
    cb('ok')
end)


