import './VehicleHUDStyle4.css'
import hudImage from './carhud/Style4/sytle4.png'
import '@mdi/font/css/materialdesignicons.min.css'

interface VehicleHUDStyle4Props {
  speed: number
  rpm: number
  gear: number
  fuel: number
  engineHealth: number
  seatbelt: boolean
  lights: boolean
  highbeams?: boolean
  doors: boolean
  leftSignal?: boolean
  rightSignal?: boolean
  speedUnit?: 'kmh' | 'mph'
}

const VehicleHUDStyle4 = ({
  speed,
  gear,
  fuel,
  engineHealth,
  seatbelt,
  doors,
  speedUnit = 'kmh'
}: VehicleHUDStyle4Props) => {
  // ============================================
  // SPEED UNIT SYSTEM - KMH or MPH
  // ============================================
  // Speed from client.lua is always in KMH
  // Convert to MPH if needed and adjust gauge accordingly
  
  const isKmh = speedUnit === 'kmh'
  const maxSpeed = isKmh ? 220 : 180  // KMH: 220 max, MPH: 180 max
  
  // Convert speed if using MPH
  let displaySpeed = Math.abs(speed)  // Use absolute value for reverse
  if (!isKmh) {
    displaySpeed = displaySpeed * 0.621371  // Convert KMH to MPH
  }
  
  const clampedSpeed = Math.min(displaySpeed, maxSpeed)
  
  // Calculate needle rotation (0 degrees = 0 speed, 180 degrees = max speed)
  const speedRotation = (clampedSpeed / maxSpeed) * 180
  
  // ============================================
  // RED ZONE ACTIVATION - After 140 speed
  // ============================================
  const inRedZone = clampedSpeed > 140
  
  // ============================================
  // GEAR INDICATOR - 6 Gears (N, 1-6) - Counter-clockwise
  // ============================================
  const gearScale = [
    { value: 6, top: '18%', right: '27.7%' },
    { value: 5, top: '29%', right: '17.3%' },
    { value: 4, top: '46%', right: '12.3%' },
    { value: 3, top: '65%', right: '12.7%' },
    { value: 2, top: '83%', right: '16.3%' },
    { value: 1, top: '83%', right: '22.8%' },
    { value: 'R', top: '83%', right: '28.5%', label: 'R' }
  ]
  
  // Calculate angles based on actual gear positions on the gauge
  // Adjusted to match where each number actually appears
  const gearAngles: { [key: number]: number } = {
    0: -10,       // N - bottom center = 0°
    1: -25,     // Gear 1 - bottom-left = -25°
    2: -50,     // Gear 2 - left = -50°
    3: -70,     // Gear 3 - mid-right (at 65%) = -75°
    4: -95,    // Gear 4 - upper-right (at 46%) = -105°
    5: -130,    // Gear 5 - upper (at 29%) = -140°
    6: -170     // Gear 6 - top (at 18%) = -170°
  }
  
  const currentGear = gear === 0 ? 0 : Math.min(Math.max(gear, 0), 6)
  const gearRotation = gearAngles[currentGear] || 0
  
  // Speed scale numbers - changes based on unit
  // High speed numbers (160+) only visible when speed > 140
  const speedScale = isKmh ? [
    { value: 200, top: '18%', left: '27.7%', redZone: true }, // Only visible after 140
    { value: 180, top: '21%', left: '19.7%', redZone: true }, // Only visible after 140
    { value: 160, top: '29%', left: '17.3%', redZone: true }, // Only visible after 140
    { value: 140, top: '38%', left: '14.3%', redZone: false },
    { value: 120, top: '46%', left: '12.3%', redZone: false },
    { value: 100, top: '55%', left: '11%', redZone: false },
    { value: 80, top: '65%', left: '12.7%', redZone: false },
    { value: 60, top: '74.7%', left: '15.3%', redZone: false },
    { value: 40, top: '83%', left: '19.3%', redZone: false },
    { value: 20, top: '83%', left: '25.8%', redZone: false },
    { value: 0, top: '83%', left: '31.5%', redZone: false }
  ] : [
    { value: 180, top: '18%', left: '27.7%', redZone: true }, // Only visible after 140
    { value: 160, top: '21%', left: '19.7%', redZone: true }, // Only visible after 140
    { value: 140, top: '29%', left: '17.3%', redZone: false },
    { value: 120, top: '38%', left: '14.3%', redZone: false },
    { value: 100, top: '46%', left: '12.3%', redZone: false },
    { value: 80, top: '55%', left: '11%', redZone: false },
    { value: 60, top: '65%', left: '12.7%', redZone: false },
    { value: 40, top: '74.7%', left: '15.3%', redZone: false },
    { value: 20, top: '83%', left: '19.3%', redZone: false },
    { value: 0, top: '83%', left: '31.5%', redZone: false }
  ]
  


  return (
    <div className="style4-hud-container">
      <img 
        src={hudImage} 
        alt="Vehicle HUD Style 4" 
        className="style4-base-image"
      />
      
      {/* Left Side - Speedometer */}
      <div className="style4-left-gauge">
        {/* Speed Numbers along curved border */}
        {speedScale.map((item) => {
          // Hide red zone numbers until speed > 140
          const isVisible = !item.redZone || inRedZone
          
          // Determine color based on speed
          let numberColor = 'rgba(255, 255, 255, 0.3)' // Default: dim white
          
          if (clampedSpeed >= item.value) {
            // Speed reached this number
            if (item.redZone && inRedZone) {
              // Red zone numbers - RED when reached
              numberColor = '#ff0000'
            } else if (item.value <= 60) {
              // Low speed - cyan
              numberColor = '#00d9ff'
            } else {
              // Normal speed - white
              numberColor = '#ffffff'
            }
          } else {
            // Speed hasn't reached this number yet
            if (item.value <= 60) {
              numberColor = 'rgba(0, 217, 255, 0.3)' // Dim cyan
            } else {
              numberColor = 'rgba(255, 255, 255, 0.3)' // Dim white
            }
          }
          
          return (
            <div 
              key={item.value} 
              className="style4-speed-number"
              style={{ 
                top: item.top,
                left: item.left,
                color: numberColor,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease, color 0.2s ease'
              }}
            >
              {item.value}
            </div>
          )
        })}
        {/* Realistic Speed Needle */}
        <div className="style4-needle-container">
          <div 
            className="style4-speed-needle"
            style={{ transform: `rotate(${speedRotation}deg)` }}
          >
            <div className="style4-needle-tip" />
          </div>
          <div className="style4-needle-center" />
        </div>
      </div>
      
      {/* Right Side - Gear Indicator */}
      <div className="style4-right-gauge">
        {/* Gear Numbers */}
        {gearScale.map((item) => {
          const isCurrentGear = gear === item.value || (gear === 0 && item.value === 'R')
          const gearColor = isCurrentGear ? '#ffffff' : 'rgba(255, 255, 255, 0.3)'  // Bright white when active
          
          return (
            <div 
              key={item.value} 
              className="style4-gear-number"
              style={{ 
                top: item.top,
                right: item.right,
                color: gearColor,
                transition: 'color 0.2s ease'
              }}
            >
              {item.label || item.value}
            </div>
          )
        })}
        
        {/* Blue Gear Needle with Sharp Tip */}
        <div className="style4-gear-needle-container">
          <div 
            className="style4-gear-needle"
            style={{ transform: `rotate(${gearRotation}deg)` }}
          >
            <div className="style4-gear-needle-tip" />
          </div>
          <div className="style4-gear-needle-center" />
        </div>
      </div>
      
      {/* Center - Minimal Icons */}
      <div className="style4-center-indicators">
        {/* Fuel - Icon + Percentage */}
        <div className="style4-minimal-row">
          <i className="mdi mdi-gas-station" style={{ color: fuel < 20 ? '#e24242c4' : '#ffffffff' }}></i>
          <span style={{ color: fuel < 20 ? '#e43535b7' : '#ffffff' }}>{Math.floor(fuel)}%</span>
        </div>
        
        {/* Engine - Icon + Percentage */}
        <div className="style4-minimal-row">
          <i className="mdi mdi-wrench" style={{ color: engineHealth < 30 ? '#ee28287c' : '#ffffffff' }}></i>
          <span style={{ color: engineHealth < 30 ? '#ec3030a9' : '#ffffff' }}>{Math.floor(engineHealth)}%</span>
        </div>
        
        {/* Seatbelt - Always Visible */}
        <div className={`style4-minimal-row ${!seatbelt ? 'style4-seatbelt-blink' : ''}`}>
          <i className="mdi mdi-seatbelt" style={{ color: seatbelt ? '#ede8eeff' : '#ffffff' }}></i>
        </div>
        
        {/* Door - Icon Only */}
        {doors && (
          <div className="style4-minimal-row style4-warning-blink">
            <i className="mdi mdi-car-door" style={{ color: '#f8f8f8ff' }}></i>
          </div>
        )}
      </div>
    </div>
  )
}

export default VehicleHUDStyle4
