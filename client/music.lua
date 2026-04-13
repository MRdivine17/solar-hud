-- Music Player with xSound Integration
local currentMusic = nil
local musicVolume = 0.5
local isMusicPlaying = false

-- Open Music Player
RegisterCommand('music', function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openMusicPlayer'
    })
end, false)

-- Add command suggestion
TriggerEvent('chat:addSuggestion', '/music', 'Open the music player to play YouTube music')

-- Alternative command
RegisterCommand('musicplayer', function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openMusicPlayer'
    })
end, false)

TriggerEvent('chat:addSuggestion', '/musicplayer', 'Open the music player to play YouTube music')

-- Register keybind (optional - players can bind in Settings > Key Bindings > FiveM)
RegisterKeyMapping('music', 'Open Music Player', 'keyboard', '')

-- Close Music Player
RegisterNUICallback('closeMusicPlayer', function(data, cb)
    SetNuiFocus(false, false)
    cb('ok')
end)

-- Extract YouTube Video ID from URL
local function extractVideoId(url)
    -- Pattern 1: youtube.com/watch?v=VIDEO_ID
    local videoId = string.match(url, "youtube%.com/watch%?v=([%w%-_]+)")
    if videoId then return videoId end
    
    -- Pattern 2: youtu.be/VIDEO_ID
    videoId = string.match(url, "youtu%.be/([%w%-_]+)")
    if videoId then return videoId end
    
    -- Pattern 3: youtube.com/embed/VIDEO_ID
    videoId = string.match(url, "youtube%.com/embed/([%w%-_]+)")
    if videoId then return videoId end
    
    -- Pattern 4: Direct video ID (11 characters)
    if string.len(url) == 11 and string.match(url, "^[%w%-_]+$") then
        return url
    end
    
    return nil
end

-- Play Music
RegisterNUICallback('playMusic', function(data, cb)
    local url = data.url
    local volume = data.volume or 0.5
    
    -- Stop current music if playing
    if currentMusic then
        exports.xsound:Destroy(currentMusic)
        currentMusic = nil
    end
    
    -- Extract video ID
    local videoId = extractVideoId(url)
    if not videoId then
        --print('[Music Player] Invalid YouTube URL')
        cb('error')
        return
    end
    
    -- Get player position
    local playerPed = PlayerPedId()
    local playerCoords = GetEntityCoords(playerPed)
    
    -- Create unique sound ID
    local soundId = 'music_' .. GetPlayerServerId(PlayerId()) .. '_' .. GetGameTimer()
    currentMusic = soundId
    musicVolume = volume
    isMusicPlaying = true
    
    -- Play music using xSound
    exports.xsound:PlayUrlPos(soundId, 'https://www.youtube.com/watch?v=' .. videoId, volume, playerCoords, false)
    exports.xsound:Distance(soundId, 50.0) -- 50 meter radius
    exports.xsound:setVolume(soundId, volume)
    
    -- Sync with server for other players
    TriggerServerEvent('hud:syncMusic', soundId, videoId, playerCoords, volume)
    
    --print('[Music Player] Now playing: ' .. videoId)
    cb('ok')
end)

-- Toggle Play/Pause
RegisterNUICallback('toggleMusic', function(data, cb)
    if currentMusic then
        local playing = data.playing
        
        if playing then
            exports.xsound:Resume(currentMusic)
            isMusicPlaying = true
        else
            exports.xsound:Pause(currentMusic)
            isMusicPlaying = false
        end
        
        TriggerServerEvent('hud:toggleMusic', currentMusic, playing)
    end
    cb('ok')
end)

-- Stop Music
RegisterNUICallback('stopMusic', function(data, cb)
    if currentMusic then
        exports.xsound:Destroy(currentMusic)
        TriggerServerEvent('hud:stopMusic', currentMusic)
        currentMusic = nil
        isMusicPlaying = false
    end
    cb('ok')
end)

-- Set Volume
RegisterNUICallback('setVolume', function(data, cb)
    local volume = data.volume or 0.5
    musicVolume = volume
    
    if currentMusic then
        exports.xsound:setVolume(currentMusic, volume)
        TriggerServerEvent('hud:setMusicVolume', currentMusic, volume)
    end
    cb('ok')
end)

-- Update music position (follow player)
Citizen.CreateThread(function()
    while true do
        Citizen.Wait(500)
        
        if currentMusic and isMusicPlaying then
            local playerPed = PlayerPedId()
            local playerCoords = GetEntityCoords(playerPed)
            
            -- Update position
            exports.xsound:Position(currentMusic, playerCoords)
        end
    end
end)

-- Receive synced music from other players
RegisterNetEvent('hud:receiveSyncedMusic')
AddEventHandler('hud:receiveSyncedMusic', function(soundId, videoId, coords, volume, sourcePlayer)
    local myServerId = GetPlayerServerId(PlayerId())
    
    -- Don't play our own music again
    if sourcePlayer == myServerId then
        return
    end
    
    -- Play the synced music
    exports.xsound:PlayUrlPos(soundId, 'https://www.youtube.com/watch?v=' .. videoId, volume, coords, false)
    exports.xsound:Distance(soundId, 50.0)
    exports.xsound:setVolume(soundId, volume)
end)

-- Receive toggle from other players
RegisterNetEvent('hud:receiveMusicToggle')
AddEventHandler('hud:receiveMusicToggle', function(soundId, playing)
    if exports.xsound:soundExists(soundId) then
        if playing then
            exports.xsound:Resume(soundId)
        else
            exports.xsound:Pause(soundId)
        end
    end
end)

-- Receive stop from other players
RegisterNetEvent('hud:receiveMusicStop')
AddEventHandler('hud:receiveMusicStop', function(soundId)
    if exports.xsound:soundExists(soundId) then
        exports.xsound:Destroy(soundId)
    end
end)

-- Receive volume change from other players
RegisterNetEvent('hud:receiveMusicVolume')
AddEventHandler('hud:receiveMusicVolume', function(soundId, volume)
    if exports.xsound:soundExists(soundId) then
        exports.xsound:setVolume(soundId, volume)
    end
end)

-- Cleanup on resource stop
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        if currentMusic then
            exports.xsound:Destroy(currentMusic)
        end
    end
end)
