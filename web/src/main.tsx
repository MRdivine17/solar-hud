import React from 'react'
import ReactDOM from 'react-dom/client'
// Self-hosted fallback face (SIL OFL) - bundled, no network request
import '@fontsource-variable/inter'
import App from './App.tsx'
// fonts.css must come before index.css so --hud-font exists for everything
import './fonts.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
