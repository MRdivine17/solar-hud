import './BoatHUD3.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface BoatHUD3Props {
  speed: number
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

const BoatHUD3 = ({
  speed,
  fuel,
  engineHealth,
  anchor,
  lights,
  engineOn,
  speedUnit = 'mph',
  waveHeight = 0,
  waterDepth = 0,
  compassHeading = 0
}: BoatHUD3Props) => {
  // Speed conversion
  const isKmh = speedUnit === 'kmh'
  let displaySpeed = Math.abs(speed)
  if (!isKmh) {
    displaySpeed = displaySpeed * 0.621371
  }

  // Get compass direction
  const getCompassDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(heading / 45) % 8
    return directions[index]
  }

  // Get wave condition
  const getWaveCondition = (height: number) => {
    if (height < 0.5) return 'CALM'
    if (height < 1.5) return 'MODERATE'
    if (height < 3) return 'ROUGH'
    return 'SEVERE'
  }

  return (
    <div className="boathud3-container">
      {/* Main Speed Card */}
      <div className="boathud3-speed-card">
        <div className="boathud3-speed-header">SPEED</div>
        <div className="boathud3-speed-value">{Math.floor(displaySpeed)}</div>
        <div className="boathud3-speed-unit">{isKmh ? 'KMH' : 'KNOTS'}</div>
      </div>

      {/* Navigation Card */}
      <div className="boathud3-nav-card">
        <div className="boathud3-card-header">
          <i className="mdi mdi-compass"></i>
          <span>NAVIGATION</span>
        </div>
        <div className="boathud3-nav-content">
          <div className="boathud3-nav-item">
            <span className="boathud3-nav-label">HEADING</span>
            <span className="boathud3-nav-value">{Math.floor(compassHeading)}° {getCompassDirection(compassHeading)}</span>
          </div>
          <div className="boathud3-nav-divider" />
          <div className="boathud3-nav-item">
            <span className="boathud3-nav-label">DEPTH</span>
            <span className="boathud3-nav-value depth">{Math.floor(waterDepth)}m</span>
          </div>
        </div>
      </div>

      {/* Conditions Card */}
      <div className="boathud3-conditions-card">
        <div className="boathud3-card-header">
          <i className="mdi mdi-waves"></i>
          <span>SEA STATE</span>
        </div>
        <div className="boathud3-conditions-content">
          <div className="boathud3-condition-item">
            <span className="boathud3-condition-label">WAVES</span>
            <span className={`boathud3-condition-badge ${getWaveCondition(waveHeight).toLowerCase()}`}>
              {getWaveCondition(waveHeight)}
            </span>
          </div>
          <div className="boathud3-condition-value">{waveHeight.toFixed(1)}m</div>
        </div>
      </div>

      {/* Systems Card */}
      <div className="boathud3-systems-card">
        <div className="boathud3-card-header">
          <i className="mdi mdi-wrench"></i>
          <span>SYSTEMS</span>
        </div>
        <div className="boathud3-systems-grid">
          <div className="boathud3-system-item">
            <i className="mdi mdi-gas-station boathud3-system-icon"></i>
            <div className="boathud3-system-bar">
              <div 
                className="boathud3-system-fill fuel"
                style={{ width: `${fuel}%` }}
              />
            </div>
            <span className="boathud3-system-percent">{Math.floor(fuel)}%</span>
          </div>
          <div className="boathud3-system-item">
            <i className="mdi mdi-wrench boathud3-system-icon"></i>
            <div className="boathud3-system-bar">
              <div 
                className="boathud3-system-fill engine"
                style={{ width: `${engineHealth}%` }}
              />
            </div>
            <span className="boathud3-system-percent">{Math.floor(engineHealth)}%</span>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="boathud3-status-row">
        <div className={`boathud3-status-badge ${engineOn ? 'active' : ''}`}>
          <div className="boathud3-status-dot" />
          <span>ENGINE</span>
        </div>
        <div className={`boathud3-status-badge ${lights ? 'active' : ''}`}>
          <i className="mdi mdi-lightbulb"></i>
          <span>LIGHTS</span>
        </div>
        <div className={`boathud3-status-badge ${anchor ? 'active anchor' : ''}`}>
          <i className="mdi mdi-anchor"></i>
          <span>ANCHOR</span>
        </div>
      </div>
    </div>
  )
}

export default BoatHUD3
