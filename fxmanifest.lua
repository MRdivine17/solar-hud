fx_version 'cerulean'
game 'gta5'

author 'Advanced HUD'
description 'Modern HUD System with React + Vite + TypeScript'
version '1.0.1'

shared_scripts {
    'shared/config.lua'
}

client_scripts {
    'client/main.lua',
    'client/music.lua'
}

server_scripts {
    'server/version_check.lua',
    'server/main.lua',
    'server/music.lua'
}

ui_page 'web/build/index.html'

files {
    'web/build/index.html',
    'web/build/**/*',
    'web/img/**/*', -- Logo files go here (e.g., web/img/logo.png)
    'stream/minimap.gfx'
}

escrow_ignore {
    'client/custom_cl.lua',
    'client/music.lua',
    'server/custom_sv.lua',
    'server/music.lua',
    'shared/config.lua'
}

-- Stream YTD texture file for custom minimap
data_file 'TEXTURE_FILE' 'stream/minimap_layout.ytd'

dependency '/onesync'