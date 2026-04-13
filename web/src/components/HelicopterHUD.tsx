import './HelicopterHUD.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface HelicopterHUDProps {
  pitch: number // Pitch angle -90 to 90
  roll: number // Roll angle -180 to 180
  altitude: number // Altitude in feet
  heading: number // Compass heading 0-360
  speed: number // Airspeed in km/h
  fuel: number // Fuel percentage 0-100
  engineOn: boolean // Engine status
  lights: boolean // Lights status
  speedUnit?: 'kmh' | 'mph' | 'knots' // Speed unit preference
}

const HelicopterHUD = ({
  pitch,
  roll,
  altitude,
  heading,
  speed,
  fuel,
  engineOn,
  lights,
  speedUnit = 'mph'
}: HelicopterHUDProps) => {
  
  // Get fuel status color
  const getFuelColor = () => {
    if (fuel > 50) return '#ffffff'
    if (fuel > 20) return '#ffa500'
    return '#ff4444'
  }
  // Convert speed based on unit
  let displaySpeed = speed // km/h by default
  let unitLabel = 'KMH'
  
  if (speedUnit === 'mph') {
    displaySpeed = speed * 0.621371
    unitLabel = 'MPH'
  } else if (speedUnit === 'knots') {
    displaySpeed = speed * 0.539957
    unitLabel = 'KTS'
  }

  // Get compass direction
  const getCompassDirection = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(deg / 45) % 8
    return directions[index]
  }

  // Round values to reduce shaking
  const roundedPitch = Math.round(pitch)
  const roundedRoll = Math.round(roll)
  const roundedAltitude = Math.round(altitude / 10) * 10 // Round to nearest 10
  const roundedHeading = Math.round(heading)
  const roundedSpeed = Math.round(displaySpeed)
  const roundedFuel = Math.round(fuel)

  // Format numbers with leading zeros
  const formatNumber = (num: number, digits: number) => {
    return Math.abs(Math.floor(num)).toString().padStart(digits, '0')
  }

  // Format signed number
  const formatSigned = (num: number, digits: number) => {
    const sign = num >= 0 ? '' : '-'
    return sign + formatNumber(num, digits)
  }

  return (
    <div className="helicopterhud-modern-container">
      {/* Top Row - Pitch and Fuel */}
      <div className="helicopterhud-modern-row">
        <div className="helicopterhud-modern-card">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-airplane-takeoff"></i>
            <span>PITCH</span>
          </div>
          <div className="helicopterhud-card-value">{formatSigned(roundedPitch, 2)}°</div>
        </div>
        <div className="helicopterhud-modern-card">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-gas-station"></i>
            <span>FUEL</span>
          </div>
          <div className="helicopterhud-card-value" style={{ color: getFuelColor() }}>{formatNumber(roundedFuel, 2)}%</div>
        </div>
      </div>

      {/* Middle Row - Roll and Altitude */}
      <div className="helicopterhud-modern-row">
        <div className="helicopterhud-modern-card">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-rotate-3d-variant"></i>
            <span>ROLL</span>
          </div>
          <div className="helicopterhud-card-value">{formatSigned(roundedRoll, 2)}°</div>
        </div>
        <div className="helicopterhud-modern-card helicopterhud-card-large">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-altimeter"></i>
            <span>ALTITUDE</span>
          </div>
          <div className="helicopterhud-card-value-group">
            <span className="helicopterhud-card-value">{formatNumber(roundedAltitude, 4)}</span>
            <span className="helicopterhud-card-unit">FT</span>
          </div>
        </div>
      </div>

      {/* Bottom Row - Heading and Airspeed */}
      <div className="helicopterhud-modern-row">
        <div className="helicopterhud-modern-card">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-compass"></i>
            <span>HEADING</span>
          </div>
          <div className="helicopterhud-card-value-group">
            <span className="helicopterhud-card-value">{formatNumber(roundedHeading, 3)}°</span>
            <span className="helicopterhud-card-compass">{getCompassDirection(roundedHeading)}</span>
          </div>
        </div>
        <div className="helicopterhud-modern-card helicopterhud-card-large">
          <div className="helicopterhud-card-header">
            <i className="mdi mdi-speedometer"></i>
            <span>AIRSPEED</span>
          </div>
          <div className="helicopterhud-card-value-group">
            <span className="helicopterhud-card-value">{formatNumber(roundedSpeed, 3)}</span>
            <span className="helicopterhud-card-unit">{unitLabel}</span>
          </div>
        </div>
      </div>

      {/* Status Indicators Bar */}
      <div className="helicopterhud-modern-status-bar">
        {/* Engine */}
        <div className="helicopterhud-modern-status">
          <i className={`mdi mdi-engine ${engineOn ? 'status-on' : 'status-off'}`}></i>
          <span>ENGINE</span>
        </div>

        {/* Lights */}
        <div className="helicopterhud-modern-status">
          <i className={`mdi mdi-lightbulb ${lights ? 'status-on' : 'status-off'}`}></i>
          <span>LIGHTS</span>
        </div>

        {/* Fuel Warning */}
        <div className="helicopterhud-modern-status">
          <i className={`mdi mdi-fuel ${fuel > 20 ? 'status-on' : 'status-warning'}`}></i>
          <span>FUEL</span>
        </div>

        {/* Rotor Status */}
        <div className="helicopterhud-modern-status">
          <i className={`mdi mdi-fan ${engineOn ? 'status-on rotor-spin' : 'status-off'}`}></i>
          <span>ROTOR</span>
        </div>
      </div>
    </div>
  )
}

export default HelicopterHUD
