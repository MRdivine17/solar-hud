import './VehicleHUD.css'
import '@mdi/font/css/materialdesignicons.min.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface VehicleHUDProps {
  data: {
    inVehicle: boolean
    speed: number
    fuel: number
    rpm: number
    gear: number
    engineHealth: number
    odometer?: number
    seatbelt?: boolean
    engineOn?: boolean
    lights?: boolean
    highbeams?: boolean
    doorOpen?: boolean
    indicators?: {
      left: boolean
      right: boolean
      hazard: boolean
    }
  }
  speedUnit?: 'kmh' | 'mph'
}

const VehicleHUD = ({ data, speedUnit = 'kmh' }: VehicleHUDProps) => {
  if (!data.inVehicle) return null

  // Convert speed based on unit
  const displaySpeed = speedUnit === 'mph' 
    ? Math.floor(data.speed * 0.621371) // km/h to mph
    : Math.floor(data.speed)

  // Determine if engine is critically damaged
  const engineCritical = data.engineHealth < 40

  return (
    <div className="vehicle-speedometer">
      {/* Fuel Bar */}
      <div className="fuel-bar-container">
        <i className="mdi mdi-gas-station fuel-icon"></i>
        <div className="fuel-bar-bg">
          <div 
            className="fuel-bar-fill" 
            style={{ width: `${data.fuel}%` }}
          />
        </div>
      </div>

      {/* Warning Icons */}
      <div className="warning-icons">
        <div className={`warning-icon ${data.seatbelt ? 'active' : 'blink'}`}>
          <i className="mdi mdi-seatbelt"></i>
        </div>
        <div className={`warning-icon ${engineCritical ? 'active blink' : ''}`}>
          <i className="mdi mdi-wrench"></i>
        </div>
        <div className={`warning-icon ${data.doorOpen ? 'active' : ''}`}>
          <i className="mdi mdi-car-door"></i>
        </div>
      </div>

      {/* Speed Display */}
      <div className="speed-display">
        <div className="speed-box">
          <div className="speed-number">{displaySpeed}</div>
        </div>
        <div className="speed-unit-label">{speedUnit.toUpperCase()}</div>
      </div>

      {/* Gear Numbers */}
      <div className="gear-numbers">
        {[1, 2, 3, 4, 5, 6].map((gearNum) => (
          <div 
            key={gearNum}
            className={`gear-number ${data.gear === gearNum ? 'active' : ''}`}
          >
            {gearNum}
          </div>
        ))}
      </div>
    </div>
  )
}

export default VehicleHUD
