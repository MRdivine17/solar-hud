import './VehicleHUD2.css'
import '@mdi/font/css/materialdesignicons.min.css'
import { useState, useEffect } from 'react'

interface VehicleHUD2Props {
  speed: number
  maxSpeed: number
  rpm: number
  gear: number
  fuel: number
  engineHealth: number
  seatbelt: boolean
  lights: boolean
  highbeams?: boolean
  doors: boolean
  engine: boolean
  speedUnit?: 'kmh' | 'mph'
}

const VehicleHUD2 = ({
  speed,
  fuel,
  engineHealth,
  seatbelt,
  lights,
  highbeams = false,
  doors,
  speedUnit = 'kmh'
}: VehicleHUD2Props) => {
  const [currentGear, setCurrentGear] = useState(0)
  const [currentRPM, setCurrentRPM] = useState(800)
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (speed === 0) {
      setCurrentGear(0)
      setCurrentRPM(800)
      return
    }

    if (speed < 0) {
      setCurrentGear(-1)
      setCurrentRPM(1500)
      return
    }

    const gearRatios = [0, 4.0, 2.8, 2.0, 1.5, 1.2, 1.0]
    const baseRPM = 800
    const maxRPM = 7000
    const shiftUpRPM = 6500
    const shiftDownRPM = 2000

    let calculatedRPM = baseRPM + (speed * 45 * gearRatios[currentGear || 1])

    if (calculatedRPM > shiftUpRPM && currentGear < 6) {
      setCurrentGear(prev => prev + 1)
      calculatedRPM = baseRPM + (speed * 45 * gearRatios[currentGear + 1])
    } else if (calculatedRPM < shiftDownRPM && currentGear > 1) {
      setCurrentGear(prev => prev - 1)
      calculatedRPM = baseRPM + (speed * 45 * gearRatios[currentGear - 1])
    } else if (currentGear === 0 && speed > 5) {
      setCurrentGear(1)
      calculatedRPM = baseRPM + (speed * 45 * gearRatios[1])
    }

    setCurrentRPM(Math.min(calculatedRPM, maxRPM))
  }, [speed, currentGear])

  // Blinking effect for door and low engine health
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Create continuous arc with SQUARE ends (butt linecap)
  const createArc = (percentage: number, radius: number) => {
    const startAngle = 135
    const totalAngle = 270
    const endAngle = startAngle + (totalAngle * percentage / 100)
    
    const start = startAngle * (Math.PI / 180)
    const end = endAngle * (Math.PI / 180)
    
    const x1 = 140 + radius * Math.cos(start)
    const y1 = 140 + radius * Math.sin(start)
    const x2 = 140 + radius * Math.cos(end)
    const y2 = 140 + radius * Math.sin(end)
    
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Create LEFT half arc for fuel (135° to 225° - left side, half of speed bar)
  const createLeftHalfArc = (percentage: number, radius: number) => {
    const startAngle = 135 // Top-left start
    const totalAngle = 90 // Half of the 180° upper arc
    const endAngle = startAngle + (totalAngle * percentage / 100)
    
    const start = startAngle * (Math.PI / 180)
    const end = endAngle * (Math.PI / 180)
    
    const x1 = 140 + radius * Math.cos(start)
    const y1 = 140 + radius * Math.sin(start)
    const x2 = 140 + radius * Math.cos(end)
    const y2 = 140 + radius * Math.sin(end)
    
    const largeArc = 0
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Create RIGHT half arc for engine (405° to 315° - right side, REVERSED to match fuel direction)
  const createRightHalfArc = (percentage: number, radius: number) => {
    const endAngle = 405 // Bottom-right end
    const totalAngle = 90 // Half of the 180° upper arc
    const startAngle = endAngle - (totalAngle * percentage / 100) // Draw backwards from bottom
    
    const start = startAngle * (Math.PI / 180)
    const end = endAngle * (Math.PI / 180)
    
    const x1 = 140 + radius * Math.cos(start)
    const y1 = 140 + radius * Math.sin(start)
    const x2 = 140 + radius * Math.cos(end)
    const y2 = 140 + radius * Math.sin(end)
    
    const largeArc = 0
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Calculate gear number positions ABOVE the speed
  const getGearNumberPosition = (gearNum: number) => {
    const totalGears = 6
    const spacing = 28
    const startX = 140 - ((totalGears - 1) * spacing) / 2
    
    return {
      x: startX + ((gearNum - 1) * spacing),
      y: 100
    }
  }

  const speedPercentage = Math.min((speed / 200) * 100, 100)
  const rpmPercentage = (currentRPM / 7000) * 100
  const fuelPercentage = Math.max(0, Math.min(fuel, 100))
  const enginePercentage = Math.max(0, Math.min(engineHealth, 100))

  return (
    <div className="vehicle-hud2">
      <svg className="hud2-svg" viewBox="0 0 280 280">
        {/* OUTER LEFT - Fuel bar (half arc on left side, above speed bar) */}
        <path
          d={createLeftHalfArc(100, 130)}
          fill="none"
          stroke="rgba(90, 159, 212, 0.2)"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        <path
          d={createLeftHalfArc(fuelPercentage, 130)}
          fill="none"
          stroke="#5a9fd4"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        
        {/* OUTER RIGHT - Engine Health bar (half arc on right side, above speed bar) */}
        <path
          d={createRightHalfArc(100, 130)}
          fill="none"
          stroke="rgba(90, 159, 212, 0.2)"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        <path
          d={createRightHalfArc(enginePercentage, 130)}
          fill="none"
          stroke="#5a9fd4"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        
        {/* Background arc for speed - WHITE with square ends */}
        <path
          d={createArc(100, 119)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="10"
          strokeLinecap="butt"
        />
        
        {/* Speed progress arc - WHITE with square ends */}
        <path
          d={createArc(speedPercentage, 119)}
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="butt"
        />
        
        {/* Background arc for RPM - BLUE with square ends */}
        <path
          d={createArc(100, 109)}
          fill="none"
          stroke="rgba(90, 159, 212, 0.2)"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        
        {/* RPM progress arc - BLUE with square ends */}
        <path
          d={createArc(rpmPercentage, 109)}
          fill="none"
          stroke="#5a9fd4"
          strokeWidth="5"
          strokeLinecap="butt"
        />
        
        {/* Gear numbers ABOVE the speed */}
        {[1, 2, 3, 4, 5, 6].map((gear) => {
          const pos = getGearNumberPosition(gear)
          const isActive = currentGear === gear
          
          return (
            <text
              key={gear}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="gear-number"
              fill={isActive ? '#5a9fd4' : 'rgba(255, 255, 255, 0.3)'}
              fontSize="20"
              fontWeight={isActive ? '700' : '400'}
            >
              {gear}
            </text>
          )
        })}
      </svg>
      
      {/* Center Content */}
      <div className="hud2-center">
        {/* Large Speed */}
        <div className="hud2-speed">{Math.round(speed)}</div>
        <div className="hud2-unit-below">{speedUnit.toUpperCase()}</div>
        
        {/* Bottom Icons */}
        <div className="hud2-icons">
          {/* Seatbelt Icon - Blinks violently when NOT wearing seatbelt */}
          <div className={`hud2-icon seatbelt-icon ${!seatbelt ? 'active blink-violent' : 'worn'}`}>
            <i className="mdi mdi-seatbelt"></i>
          </div>
          
          {/* Lights Icon - Always visible: Off (dim), Low beam (light white), High beam (bright white) */}
          <div className={`hud2-icon lights-icon ${highbeams ? 'highbeam' : lights ? 'lowbeam' : 'off'}`}>
            <i className="mdi mdi-car-light-high"></i>
          </div>
          
          {/* Door Icon - Blinks bright when door is open */}
          <div className={`hud2-icon door-icon ${doors ? 'active blink-bright' : ''}`}>
            <i className="mdi mdi-car-door"></i>
          </div>
          
          {/* Engine Health Icon - Blinks violently when health below 40% */}
          <div className={`hud2-icon engine-icon ${engineHealth < 40 ? 'active blink-violent' : ''}`}>
            <i className="mdi mdi-engine"></i>
          </div>
        </div>
      </div>
      
      {/* Fuel Icon - Below left bar start, blinks when fuel below 20% */}
      <div className={`hud2-fuel-icon ${fuel < 20 ? 'blink-fast' : ''}`}>
        <i className="mdi mdi-gas-station"></i>
      </div>
      
      {/* Engine Health Icon - Below right bar start, blinks when low */}
      <div className={`hud2-engine-icon ${engineHealth < 30 && blink ? 'blink-fast' : ''}`}>
        <i className="mdi mdi-wrench"></i>
      </div>
    </div>
  )
}

export default VehicleHUD2
