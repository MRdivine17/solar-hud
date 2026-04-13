import './FlightHUD.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface FlightHUDProps {
  pitch: number // Pitch angle -90 to 90
  roll: number // Roll angle -180 to 180
  altitude: number // Altitude in feet
  heading: number // Compass heading 0-360
  speed: number // Airspeed in km/h
  fuel: number // Fuel percentage 0-100
  engineOn: boolean // Engine status
  lights: boolean // Lights status
  gearDown: boolean // Landing gear status
  speedUnit?: 'kmh' | 'mph' | 'knots' // Speed unit preference
}

const FlightHUD = ({
  pitch,
  roll,
  altitude,
  heading,
  speed,
  fuel,
  engineOn,
  lights,
  gearDown,
  speedUnit = 'mph'
}: FlightHUDProps) => {
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

  // Check for stall warning (low speed while in the air)
  // Only show stall warning if:
  // 1. Airborne (altitude > 200ft to avoid ground warnings)
  // 2. Speed is critically low (< 60 for most aircraft)
  const isStalling = altitude > 200 && displaySpeed < 60

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
    <div className="flighthud-digital-container">
      {/* Top Row - Pitch and Fuel */}
      <div className="flighthud-digital-row">
        <div className="flighthud-digital-item">
          <span className="flighthud-digital-label">PITCH</span>
          <span className="flighthud-digital-value">{formatSigned(roundedPitch, 2)}°</span>
        </div>
        <div className="flighthud-digital-item">
          <span className="flighthud-digital-label">FUEL</span>
          <span className="flighthud-digital-value">{formatNumber(roundedFuel, 2)}%</span>
        </div>
      </div>

      {/* Middle Row - Roll and Altitude */}
      <div className="flighthud-digital-row">
        <div className="flighthud-digital-item">
          <span className="flighthud-digital-label">ROLL</span>
          <span className="flighthud-digital-value">{formatSigned(roundedRoll, 2)}°</span>
        </div>
        <div className="flighthud-digital-item flighthud-digital-item-large">
          <span className="flighthud-digital-label">ALT</span>
          <div className="flighthud-digital-value-group">
            <span className="flighthud-digital-value">{formatNumber(roundedAltitude, 4)}</span>
            <span className="flighthud-digital-unit">FT</span>
          </div>
        </div>
      </div>

      {/* Bottom Row - Heading and Airspeed */}
      <div className="flighthud-digital-row">
        <div className="flighthud-digital-item">
          <span className="flighthud-digital-label">HEAD</span>
          <div className="flighthud-digital-value-group">
            <span className="flighthud-digital-value">{formatNumber(roundedHeading, 3)}°</span>
            <span className="flighthud-digital-compass">{getCompassDirection(roundedHeading)}</span>
          </div>
        </div>
        <div className="flighthud-digital-item flighthud-digital-item-large">
          <span className="flighthud-digital-label">AIR SPD</span>
          <div className="flighthud-digital-value-group">
            <span className="flighthud-digital-value">{formatNumber(roundedSpeed, 3)}</span>
            <span className="flighthud-digital-unit">{unitLabel}</span>
          </div>
        </div>
      </div>

      {/* Status Indicators Bar */}
      <div className="flighthud-status-bar">
        {/* Engine */}
        <div className="flighthud-status-indicator">
          <div className={`flighthud-status-light ${engineOn ? 'green' : 'red'}`}></div>
          <span className="flighthud-status-label">ENG</span>
        </div>

        {/* Lights */}
        <div className="flighthud-status-indicator">
          <div className={`flighthud-status-light ${lights ? 'green' : 'red'}`}></div>
          <span className="flighthud-status-label">LIGHT</span>
        </div>

        {/* Fuel Warning */}
        <div className="flighthud-status-indicator">
          <div className={`flighthud-status-light ${fuel > 20 ? 'green' : 'red blink'}`}></div>
          <span className="flighthud-status-label">FUEL</span>
        </div>

        {/* Landing Gear */}
        <div className="flighthud-status-indicator">
          <div className={`flighthud-status-light ${gearDown ? 'red' : 'green'}`}></div>
          <span className="flighthud-status-label">GEAR</span>
        </div>

        {/* Stall Warning */}
        <div className="flighthud-status-indicator">
          <div className={`flighthud-status-light ${isStalling ? 'red blink-fast' : 'off'}`}></div>
          <span className="flighthud-status-label">STALL</span>
        </div>
      </div>
    </div>
  )
}

export default FlightHUD
