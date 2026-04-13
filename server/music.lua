-- Music Player Server-Side Sync

-- Sync music to nearby players
RegisterNetEvent('hud:syncMusic')
AddEventHandler('hud:syncMusic', function(soundId, videoId, coords, volume)
    local source = source
    
    -- Broadcast to all players
    TriggerClientEvent('hud:receiveSyncedMusic', -1, soundId, videoId, coords, volume, source)
end)

-- Sync toggle to nearby players
RegisterNetEvent('hud:toggleMusic')
AddEventHandler('hud:toggleMusic', function(soundId, playing)
    local source = source
    
    -- Broadcast to all players except source
    TriggerClientEvent('hud:receiveMusicToggle', -1, soundId, playing)
end)

-- Sync stop to nearby players
RegisterNetEvent('hud:stopMusic')
AddEventHandler('hud:stopMusic', function(soundId)
    local source = source
    
    -- Broadcast to all players except source
    TriggerClientEvent('hud:receiveMusicStop', -1, soundId)
end)

-- Sync volume to nearby players
RegisterNetEvent('hud:setMusicVolume')
AddEventHandler('hud:setMusicVolume', function(soundId, volume)
    local source = source
    
    -- Broadcast to all players except source
    TriggerClientEvent('hud:receiveMusicVolume', -1, soundId, volume)
end)
