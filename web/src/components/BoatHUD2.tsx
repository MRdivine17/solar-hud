import './BoatHUD2.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface BoatHUD2Props {
  speed: number
  gear: number
  fuel: number
  engineHealth: number
  anchor: boolean
  lights: boolean
  engineOn: boolean
  speedUnit?: 'kmh' | 'mph'
  waveHeight?: number
  waterDepth?: number
  compassHeading?: number
}

const BoatHUD2 = ({
  speed,
  gear,
  fuel,
  engineHealth,
  anchor,
  lights,
  engineOn,
  speedUnit = 'mph'
}: BoatHUD2Props) => {
  // Speed conversion
  const isKmh = speedUnit === 'kmh'
  let displaySpeed = Math.abs(speed)
  if (!isKmh) {
    displaySpeed = displaySpeed * 0.621371
  }

  return (
    <div className="boathud2-container">
      {/* Left - Progress Bars */}
      <div className="boathud2-left">
        {/* Fuel Progress Bar */}
        <div className="boathud2-bar-row">
          <i className="mdi mdi-gas-station boathud2-icon" style={{ color: '#ffa500' }}></i>
          <div className="boathud2-progress-bar">
            <div 
              className="boathud2-progress-fill fuel"
              style={{ width: `${fuel}%` }}
            />
          </div>
        </div>

        {/* Engine Progress Bar */}
        <div className="boathud2-bar-row">
          <i className="mdi mdi-wrench boathud2-icon" style={{ color: '#ffffff' }}></i>
          <div className="boathud2-progress-bar">
            <div 
              className="boathud2-progress-fill engine"
              style={{ width: `${engineHealth}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right - Speed Card */}
      <div className="boathud2-speed-card">
        <div className="boathud2-gear">{gear === 0 ? 'R' : gear === 1 ? 'N' : gear - 1}</div>
        <div className="boathud2-speed">{Math.floor(displaySpeed)}</div>
        <div className="boathud2-unit">{isKmh ? 'KMH' : 'MPH'}</div>
      </div>

      {/* Bottom Status Bar */}
      <div className="boathud2-status-bar">
        <div className="boathud2-status-item">
          <div className={`boathud2-status-indicator ${engineOn ? 'active' : ''}`} />
          <span>ENGINE</span>
        </div>

        <div className="boathud2-status-item">
          <div className={`boathud2-status-indicator ${lights ? 'active' : ''}`} />
          <span>LIGHT</span>
        </div>

        <div className="boathud2-status-item">
          <div className={`boathud2-status-indicator ${anchor ? 'active' : ''}`} />
          <span>ANCHOR</span>
        </div>
      </div>
    </div>
  )
}

export default BoatHUD2
