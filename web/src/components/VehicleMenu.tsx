import React from 'react'
import './VehicleMenu.css'
import '@mdi/font/css/materialdesignicons.min.css'

interface VehicleMenuProps {
  isOpen: boolean
  isDriver: boolean
  vehicleState: {
    engineOn: boolean
    leftIndicator: boolean
    rightIndicator: boolean
    hazardLights: boolean
    seatbelt: boolean
    cruiseControl: boolean
    interiorLight: boolean
    headlights: number
    hood: boolean
    trunk: boolean
    doorsLocked: boolean
    isAircraft?: boolean
    landingGear?: boolean
    isBoat?: boolean
    anchor?: boolean
    maxSeats?: number
    doors: {
      frontLeft: boolean
      frontRight: boolean
      rearLeft: boolean
      rearRight: boolean
    }
    windows: {
      frontLeft: boolean
      frontRight: boolean
      rearLeft: boolean
      rearRight: boolean
    }
    seats?: {
      [key: string]: boolean
    }
  }
  onClose: () => void
  onAction: (action: string, data?: any) => void
}

const VehicleMenu = ({ isOpen, isDriver, vehicleState, onClose, onAction }: VehicleMenuProps) => {
  if (!isOpen) return null

  // Debug: Log seat occupancy data
  React.useEffect(() => {
    if (vehicleState.seats) {
      // console.log('[VehicleMenu] Seat occupancy data:', {
      //   frontLeft: vehicleState.seats.frontLeft,
      //   frontRight: vehicleState.seats.frontRight,
      //   rearLeft: vehicleState.seats.rearLeft,
      //   rearRight: vehicleState.seats.rearRight
      // })
    } else {
      console.log('[VehicleMenu] No seat data received!')
    }
  }, [vehicleState.seats])

  // ESC key handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* ESC Close indicator - Top Right */}
      <div className="vehicle-menu-esc-top">
        <span className="esc-key">ESC</span>
        <span className="esc-text">to close</span>
      </div>

      <div className="vehicle-menu-minimal">
        {/* Scrollable control panel */}
        <div className="vehicle-menu-panel-scroll">
          <div className="vehicle-menu-panel">
            
            {/* SECTION 1: Engine */}
            {isDriver && (
              <>
                <div className="vehicle-section-card">
                  <div className="section-title">ENGINE</div>
                  <button 
                    className="vehicle-control-btn-large"
                    onClick={() => onAction('toggleEngine')}
                  >
                    <i className="mdi mdi-engine"></i>
                    {vehicleState.engineOn && <span className="indicator-dot"></span>}
                  </button>
                </div>

                <div className="section-divider-vertical"></div>
              </>
            )}

            {/* SECTION 2: Indicators */}
            {isDriver && (
              <>
                <div className="vehicle-section-card">
                  <div className="section-title">INDICATORS</div>
                  <div className="vehicle-section-grid-3">
                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleLeftIndicator')}
                    >
                      <i className="mdi mdi-arrow-left-bold"></i>
                      {vehicleState.leftIndicator && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleHazard')}
                    >
                      <i className="mdi mdi-hazard-lights"></i>
                      {vehicleState.hazardLights && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleRightIndicator')}
                    >
                      <i className="mdi mdi-arrow-right-bold"></i>
                      {vehicleState.rightIndicator && <span className="indicator-dot"></span>}
                    </button>
                  </div>
                </div>

                <div className="section-divider-vertical"></div>
              </>
            )}

            {/* SECTION 3: Seatbelt & Lights */}
            {isDriver && (
              <>
                <div className="vehicle-section-card">
                  <div className="section-title">SAFETY & LIGHTS</div>
                  <div className="vehicle-section-grid-2x2">
                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleSeatbelt')}
                    >
                      <i className="mdi mdi-seatbelt"></i>
                      {vehicleState.seatbelt && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('cycleHeadlights')}
                    >
                      <i className="mdi mdi-car-light-high"></i>
                      {vehicleState.headlights > 0 && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleInteriorLight')}
                    >
                      <i className="mdi mdi-lightbulb-on"></i>
                      {vehicleState.interiorLight && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleCruise')}
                    >
                      <i className="mdi mdi-speedometer"></i>
                      {vehicleState.cruiseControl && <span className="indicator-dot"></span>}
                    </button>
                  </div>
                </div>

                <div className="section-divider-vertical"></div>
              </>
            )}

            {/* SECTION 4: Hood & Trunk */}
            {isDriver && (
              <>
                <div className="vehicle-section-card">
                  <div className="section-title">HOOD & TRUNK</div>
                  <div className="vehicle-section-grid-2">
                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleHood')}
                    >
                      <i className="mdi mdi-car-cog"></i>
                      {vehicleState.hood && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleTrunk')}
                    >
                      <i className="mdi mdi-car-back"></i>
                      {vehicleState.trunk && <span className="indicator-dot"></span>}
                    </button>
                  </div>
                </div>

                <div className="section-divider-vertical"></div>
              </>
            )}

            {/* SECTION 5: Doors */}
            <div className="vehicle-section-card">
              <div className="section-title">DOORS</div>
              <div className="vehicle-section-grid-2x2">
                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleDoor', 'frontLeft')}
                >
                  <i className="mdi mdi-car-door"></i>
                  <span className="control-badge">1</span>
                  {vehicleState.doors.frontLeft && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleDoor', 'frontRight')}
                >
                  <i className="mdi mdi-car-door"></i>
                  <span className="control-badge">2</span>
                  {vehicleState.doors.frontRight && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleDoor', 'rearLeft')}
                >
                  <i className="mdi mdi-car-door"></i>
                  <span className="control-badge">3</span>
                  {vehicleState.doors.rearLeft && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleDoor', 'rearRight')}
                >
                  <i className="mdi mdi-car-door"></i>
                  <span className="control-badge">4</span>
                  {vehicleState.doors.rearRight && <span className="indicator-dot"></span>}
                </button>
              </div>
            </div>

            <div className="section-divider-vertical"></div>

            {/* SECTION 6: Windows */}
            <div className="vehicle-section-card">
              <div className="section-title">WINDOWS</div>
              <div className="vehicle-section-grid-2x2">
                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleWindow', 'frontLeft')}
                >
                  <i className="mdi mdi-window-open-variant"></i>
                  <span className="control-badge">1</span>
                  {vehicleState.windows.frontLeft && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleWindow', 'frontRight')}
                >
                  <i className="mdi mdi-window-open-variant"></i>
                  <span className="control-badge">2</span>
                  {vehicleState.windows.frontRight && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleWindow', 'rearLeft')}
                >
                  <i className="mdi mdi-window-open-variant"></i>
                  <span className="control-badge">3</span>
                  {vehicleState.windows.rearLeft && <span className="indicator-dot"></span>}
                </button>

                <button 
                  className="vehicle-control-btn"
                  onClick={() => onAction('toggleWindow', 'rearRight')}
                >
                  <i className="mdi mdi-window-open-variant"></i>
                  <span className="control-badge">4</span>
                  {vehicleState.windows.rearRight && <span className="indicator-dot"></span>}
                </button>
              </div>
            </div>

            <div className="section-divider-vertical"></div>

            {/* SECTION 7: Seats - Correct GTA V seat mapping */}
            {vehicleState.seats && vehicleState.maxSeats && vehicleState.maxSeats > 0 && (
              <>
                <div className="section-divider-vertical"></div>
                <div className="vehicle-section-card">
                  <div className="section-title">SEATS</div>
                  <div className={`vehicle-section-grid-${vehicleState.maxSeats <= 2 ? '2' : vehicleState.maxSeats <= 4 ? '2x2' : 'dynamic'}`}>
                    {/* Driver Seat (-1) */}
                    <button 
                      className={`vehicle-control-btn vehicle-seat-btn ${vehicleState.seats?.['driver'] ? 'occupied current-seat' : ''}`}
                      onClick={() => onAction('changeSeat', -1)}
                    >
                      <i className="mdi mdi-car-seat"></i>
                      <span className="control-badge">1</span>
                      {vehicleState.seats?.['driver'] && <span className="seat-occupied-dot"></span>}
                    </button>

                    {/* Front Passenger (0) */}
                    <button 
                      className={`vehicle-control-btn vehicle-seat-btn ${vehicleState.seats?.['frontRight'] ? 'occupied' : ''}`}
                      onClick={() => onAction('changeSeat', 0)}
                    >
                      <i className="mdi mdi-car-seat"></i>
                      <span className="control-badge">2</span>
                      {vehicleState.seats?.['frontRight'] && <span className="seat-occupied-dot"></span>}
                    </button>

                    {/* Rear Left (1) */}
                    {vehicleState.maxSeats > 2 && (
                      <button 
                        className={`vehicle-control-btn vehicle-seat-btn ${vehicleState.seats?.['rearLeft'] ? 'occupied' : ''}`}
                        onClick={() => onAction('changeSeat', 1)}
                      >
                        <i className="mdi mdi-car-seat"></i>
                        <span className="control-badge">3</span>
                        {vehicleState.seats?.['rearLeft'] && <span className="seat-occupied-dot"></span>}
                      </button>
                    )}

                    {/* Rear Right (2) */}
                    {vehicleState.maxSeats > 3 && (
                      <button 
                        className={`vehicle-control-btn vehicle-seat-btn ${vehicleState.seats?.['rearRight'] ? 'occupied' : ''}`}
                        onClick={() => onAction('changeSeat', 2)}
                      >
                        <i className="mdi mdi-car-seat"></i>
                        <span className="control-badge">4</span>
                        {vehicleState.seats?.['rearRight'] && <span className="seat-occupied-dot"></span>}
                      </button>
                    )}

                    {/* Additional seats for larger vehicles (5-10) */}
                    {vehicleState.maxSeats > 4 && Array.from({ length: Math.min(vehicleState.maxSeats - 4, 6) }, (_, i) => {
                      const seatIndex = i + 3; // Seats 3-8 in GTA V
                      const seatNumber = i + 5; // Display as 5-10
                      const seatKey = `seat${seatNumber}`;
                      return (
                        <button 
                          key={seatKey}
                          className={`vehicle-control-btn vehicle-seat-btn ${vehicleState.seats?.[seatKey] ? 'occupied' : ''}`}
                          onClick={() => onAction('changeSeat', seatIndex)}
                        >
                          <i className="mdi mdi-car-seat"></i>
                          <span className="control-badge">{seatNumber}</span>
                          {vehicleState.seats?.[seatKey] && <span className="seat-occupied-dot"></span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* SECTION 8: Aircraft Landing Gear */}
            {vehicleState.isAircraft && isDriver && (
              <>
                <div className="section-divider-vertical"></div>
                <div className="vehicle-section-card">
                  <div className="section-title">LANDING GEAR</div>
                  <button 
                    className="vehicle-control-btn-large"
                    onClick={() => onAction('toggleLandingGear')}
                  >
                    <i className="mdi mdi-tire"></i>
                    {/* Red dot if gear up, green if gear down */}
                    <span className={`gear-indicator-dot ${vehicleState.landingGear ? 'gear-down' : 'gear-up'}`}></span>
                  </button>
                </div>
              </>
            )}

            {/* SECTION 9: Boat Anchor */}
            {vehicleState.isBoat && isDriver && (
              <>
                <div className="section-divider-vertical"></div>
                <div className="vehicle-section-card">
                  <div className="section-title">ANCHOR</div>
                  <button 
                    className="vehicle-control-btn-large"
                    onClick={() => onAction('toggleAnchor')}
                  >
                    <i className="mdi mdi-anchor"></i>
                    {vehicleState.anchor && <span className="indicator-dot"></span>}
                  </button>
                </div>
              </>
            )}

            {/* SECTION 8: Lock & Settings */}
            {isDriver && (
              <>
                <div className="section-divider-vertical"></div>
                <div className="vehicle-section-card">
                  <div className="section-title">LOCK & SETTINGS</div>
                  <div className="vehicle-section-grid-2">
                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleLock')}
                    >
                      <i className={`mdi ${vehicleState.doorsLocked ? 'mdi-lock' : 'mdi-lock-open-variant'}`}></i>
                      {vehicleState.doorsLocked && <span className="indicator-dot"></span>}
                    </button>

                    <button 
                      className="vehicle-control-btn"
                      onClick={() => onAction('toggleExtra')}
                    >
                      <i className="mdi mdi-cog"></i>
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

export default VehicleMenu
