import './BoatHUD.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface BoatHUDProps {
  speed: number
  fuel: number
  engineHealth: number
  anchor: boolean
  lights: boolean
  engineOn: boolean
  direction: string
  speedUnit?: 'kmh' | 'mph'
}

const BoatHUD = ({
  speed,
  fuel,
  engineHealth,
  anchor,
  lights,
  engineOn,
  direction,
  speedUnit = 'mph'
}: BoatHUDProps) => {
  // Speed conversion
  const isKmh = speedUnit === 'kmh'
  let displaySpeed = Math.abs(speed)
  if (!isKmh) {
    displaySpeed = displaySpeed * 0.621371 // Convert KMH to MPH
  }

  // Calculate arc angles (270 degrees = 75% of circle)
  const maxAngle = 270
  const fuelAngle = (fuel / 100) * maxAngle
  const engineAngle = (engineHealth / 100) * maxAngle
  const speedAngle = (Math.min(displaySpeed, 200) / 200) * maxAngle

  return (
    <div className="boathud-container">
      {/* Main Row */}
      <div className="boathud-main-row">
        {/* Left Column - Engine and Fuel stacked */}
        <div className="boathud-left-column">
          {/* Engine Health Gauge (Small) - Top */}
          <div className="boathud-small-gauge">
          <svg className="boathud-small-svg" viewBox="0 0 100 100">
            <path
              d="M 15 85 A 40 40 0 1 1 85 85"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 15 85 A 40 40 0 1 1 85 85"
              fill="none"
              stroke={engineHealth < 30 ? '#ff0000' : '#ffffff'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${engineAngle * 0.87} 1000`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          <div className="boathud-small-icon">
            <i className="mdi mdi-wrench"></i>
          </div>
          </div>

          {/* Fuel Gauge (Small) - Bottom */}
          <div className="boathud-small-gauge">
          <svg className="boathud-small-svg" viewBox="0 0 100 100">
            <path
              d="M 15 85 A 40 40 0 1 1 85 85"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 15 85 A 40 40 0 1 1 85 85"
              fill="none"
              stroke={fuel < 20 ? '#ff0000' : '#ffa500'}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${fuelAngle * 0.87} 1000`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
          </svg>
          <div className="boathud-small-icon">
            <i className="mdi mdi-gas-station"></i>
          </div>
          </div>
        </div>

        {/* Large Speedometer */}
        <div className="boathud-speedometer">
        <svg className="boathud-speed-svg" viewBox="0 0 200 200">
          <path
            d="M 30 170 A 85 85 0 1 1 170 170"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 30 170 A 85 85 0 1 1 170 170"
            fill="none"
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${speedAngle * 2.35} 1000`}
            style={{ transition: 'stroke-dasharray 0.1s ease' }}
          />
        </svg>
        <div className="boathud-direction">{direction}</div>
        <div className="boathud-speed-number">{Math.floor(displaySpeed)}</div>
        <div className="boathud-speed-unit">{isKmh ? 'KMH' : 'MPH'}</div>
        </div>
      </div>

      {/* Bottom Status Bar with colored bars */}
      <div className="boathud-status-bar">
        <div className="boathud-status-item">
          <div className={`boathud-status-bar-indicator ${engineOn ? 'engine-on' : 'engine-off'}`}></div>
          <span>ENGINE</span>
        </div>

        <div className="boathud-status-item">
          <div className={`boathud-status-bar-indicator ${lights ? 'light-on' : 'light-off'}`}></div>
          <span>LIGHT</span>
        </div>

        <div className="boathud-status-item">
          <div className={`boathud-status-bar-indicator ${anchor ? 'anchor-on' : 'anchor-off'}`}></div>
          <span>ANCHOR</span>
        </div>
      </div>
    </div>
  )
}

export default BoatHUD
