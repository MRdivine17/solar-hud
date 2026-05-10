-- ============================================
-- GITHUB VERSION CHECKER
-- ============================================
-- Auto-runs on resource start.
-- Compares fxmanifest.lua `version` with the latest tag published on
-- https://github.com/MRdivine17/solar-hud/releases

local REPO_OWNER = 'MRdivine17'
local REPO_NAME  = 'solar-hud'
local API_URL    = ('https://api.github.com/repos/%s/%s/releases/latest'):format(REPO_OWNER, REPO_NAME)
local TAGS_URL   = ('https://api.github.com/repos/%s/%s/tags'):format(REPO_OWNER, REPO_NAME)
local RELEASES_PAGE = ('https://github.com/%s/%s/releases'):format(REPO_OWNER, REPO_NAME)
local RELEASE_PAGE  = ('https://github.com/%s/%s/releases/latest'):format(REPO_OWNER, REPO_NAME)
local RESOURCE = GetCurrentResourceName()

-- ANSI colors for the FiveM server console
local C = {
    reset  = '\27[0m',
    red    = '\27[31m',
    green  = '\27[32m',
    yellow = '\27[33m',
    blue   = '\27[34m',
    cyan   = '\27[36m',
    gray   = '\27[90m',
    bold   = '\27[1m'
}

local function log(color, msg)
    print(('%s[%s][VERSION]%s %s%s'):format(color, RESOURCE, C.reset, msg, C.reset))
end

-- Normalise "v1.2.3" / "1.2.3-beta" -> {1,2,3}
local function parseVersion(tag)
    if not tag then return nil end
    tag = tag:gsub('^[vV]', ''):gsub('%-.*$', '')
    local parts = {}
    for num in tag:gmatch('%d+') do
        parts[#parts + 1] = tonumber(num) or 0
    end
    if #parts == 0 then return nil end
    return parts
end

-- Returns: 1 if a > b, -1 if a < b, 0 if equal
local function compareVersions(a, b)
    local pa, pb = parseVersion(a), parseVersion(b)
    if not pa or not pb then return 0 end
    local n = math.max(#pa, #pb)
    for i = 1, n do
        local x, y = pa[i] or 0, pb[i] or 0
        if x > y then return 1 end
        if x < y then return -1 end
    end
    return 0
end

local function rawLine(color, text)
    print((color or '') .. text .. C.reset)
end

local function printBanner(localVersion, remoteVersion, status, releaseUrl)
    local bar = string.rep('=', 78)

    if status == 'up-to-date' then
        rawLine(C.green, bar)
        rawLine(C.green .. C.bold, '')
        rawLine(C.green .. C.bold, '   #    # ######     #####  ####     #####    ##   ##### ###### ')
        rawLine(C.green .. C.bold, '   #    # #    #       #   #    #    #    #  #  #    #   #      ')
        rawLine(C.green .. C.bold, '   #    # ######       #   #    #    #    # #    #   #   #####  ')
        rawLine(C.green .. C.bold, '   #    # #            #   #    #    #    # ######   #   #      ')
        rawLine(C.green .. C.bold, '   #    # #            #   #    #    #    # #    #   #   #      ')
        rawLine(C.green .. C.bold, '    ####  #            #    ####     #####  #    #   #   ###### ')
        rawLine(C.green .. C.bold, '')
        rawLine(C.green, ('   Solar HUD is UP TO DATE  -  v%s'):format(localVersion))
        rawLine(C.green, ('   Repository : https://github.com/%s/%s'):format(REPO_OWNER, REPO_NAME))
        rawLine(C.green, bar)

    elseif status == 'outdated' then
        rawLine(C.red, bar)
        rawLine(C.red .. C.bold, '')
        rawLine(C.red .. C.bold, '    ####  #    # #####  #####    ##   ##### ######    #    # ####  #    # ')
        rawLine(C.red .. C.bold, '   #    # #    # #    # #    #  #  #    #   #         ##   # #    # #    # ')
        rawLine(C.red .. C.bold, '   #    # #    # #    # #    # #    #   #   #####     # #  # #    # # ## # ')
        rawLine(C.red .. C.bold, '   #    # #    # #####  #    # ######   #   #         #  # # #    # #    # ')
        rawLine(C.red .. C.bold, '   #    # #    # #      #    # #    #   #   #         #   ## #    # #    # ')
        rawLine(C.red .. C.bold, '    ####   ####  #      #####  #    #   #   ######    #    #  ####  #    # ')
        rawLine(C.red .. C.bold, '')
        rawLine(C.red .. C.bold,    ('   !!!  AN UPDATE HAS BEEN RELEASED  -  PLEASE UPDATE  !!!'))
        rawLine(C.red,               ('   Installed version : v%s'):format(localVersion))
        rawLine(C.yellow .. C.bold,  ('   Latest release    : v%s'):format(remoteVersion))
        rawLine(C.yellow .. C.bold,  ('   Download here     : %s'):format(releaseUrl or RELEASE_PAGE))
        rawLine(C.yellow,            ('   All releases      : %s'):format(RELEASES_PAGE))
        rawLine(C.red, bar)

    elseif status == 'ahead' then
        rawLine(C.yellow, bar)
        rawLine(C.yellow .. C.bold, ('   [DEV BUILD]  Installed v%s is newer than latest public release v%s'):format(localVersion, remoteVersion))
        rawLine(C.yellow,            ('   Releases page : %s'):format(RELEASES_PAGE))
        rawLine(C.yellow, bar)

    else
        rawLine(C.red, bar)
        rawLine(C.red .. C.bold, '   [ERROR] Could not reach GitHub to verify the version.')
        rawLine(C.red,            '   Check server internet access or the repo visibility.')
        rawLine(C.red,            ('   Installed version : v%s'):format(localVersion))
        rawLine(C.red,            ('   Releases page     : %s'):format(RELEASES_PAGE))
        rawLine(C.red, bar)
    end
end

local lastStatus = { local_ = 'unknown', remote = 'unknown', state = 'unknown', url = RELEASE_PAGE }

local function doCheck(cb)
    local localVersion = GetResourceMetadata(RESOURCE, 'version', 0) or 'unknown'

    PerformHttpRequest(API_URL, function(status, body, _headers)
        local remoteVersion, releaseUrl = nil, RELEASE_PAGE

        if status == 200 and body and body ~= '' then
            remoteVersion = body:match('"tag_name"%s*:%s*"([^"]+)"')
            local htmlUrl = body:match('"html_url"%s*:%s*"([^"]+)"')
            if htmlUrl then releaseUrl = htmlUrl end
        end

        -- Fallback: no releases published yet -> try /tags
        if not remoteVersion then
            PerformHttpRequest(TAGS_URL, function(s2, b2)
                if s2 == 200 and b2 then
                    remoteVersion = b2:match('"name"%s*:%s*"([^"]+)"')
                end
                finalizeCheck(localVersion, remoteVersion, releaseUrl, cb)
            end, 'GET', '', { ['User-Agent'] = RESOURCE })
            return
        end

        finalizeCheck(localVersion, remoteVersion, releaseUrl, cb)
    end, 'GET', '', { ['User-Agent'] = RESOURCE })
end

function finalizeCheck(localVersion, remoteVersion, releaseUrl, cb)
    local state
    if not remoteVersion then
        state = 'unknown'
    else
        local cmp = compareVersions(localVersion, remoteVersion)
        if     cmp ==  0 then state = 'up-to-date'
        elseif cmp == -1 then state = 'outdated'
        else                  state = 'ahead' end
    end

    lastStatus = {
        local_ = localVersion,
        remote = remoteVersion or 'unknown',
        state  = state,
        url    = releaseUrl or RELEASE_PAGE
    }

    printBanner(localVersion, remoteVersion, state, releaseUrl)
    if type(cb) == 'function' then cb(lastStatus) end
end

-- Expose for other scripts (server/main.lua boot banner uses this)
exports('getVersionStatus', function()
    return lastStatus
end)
exports('checkVersion', function()
    doCheck()
end)

-- Manual re-check command (admin / console)
RegisterCommand('hudversion', function(source)
    if source == 0 then
        doCheck()
    else
        -- Allow in-game ace-permitted admins only
        if IsPlayerAceAllowed(source, 'command.hudversion') or IsPlayerAceAllowed(source, 'hud.admin') then
            doCheck(function(s)
                TriggerClientEvent('chat:addMessage', source, {
                    color = { s.state == 'up-to-date' and 0 or 255, s.state == 'up-to-date' and 200 or 80, 80 },
                    args  = { '[HUD]', ('Installed %s | Latest %s | %s'):format(s.local_, s.remote, s.state) }
                })
            end)
        end
    end
end, true)

-- Auto-run on resource start
AddEventHandler('onResourceStart', function(res)
    if res ~= RESOURCE then return end
    -- wrap so SetTimeout / scheduler never passes a hidden arg into cb
    SetTimeout(1500, function() doCheck() end)
end)
