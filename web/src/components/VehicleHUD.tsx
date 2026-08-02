import { memo, useRef, useState } from 'react'
import * as React from 'react'
import './VehicleHUD.css'
import '@mdi/font/css/materialdesignicons.min.css'
import { VehicleHudVisibility } from '../types'
import { readPosition, writePosition } from '../utils/layout'
import { useViewport } from '../hooks/useViewport'

const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

/* ---------------------------------------------------------------------------
   Draggable wrapper - identical contract to Location / StatusBars / PlayerInfo.
   The vehicle HUD used to be `position: fixed` with no anchor at all, so it was
   the only HUD element outside the positioning system. It now lives at
   uiPositions.vehicleHud and can be dragged in positioning mode like the rest.
--------------------------------------------------------------------------- */
const DraggableVehicleWrapper = memo(({
  children,
  positioningMode,
  hudSettings,
  defaultPosition
}: {
  children: React.ReactNode
  positioningMode?: boolean
  hudSettings?: any
  defaultPosition: { x: number; y: number }
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const positionKey = 'vehicleHud'

  // Resolve the stored design-space record against the live viewport
  const vp = useViewport()
  const savedPosition = readPosition(hudSettings?.uiPositions, positionKey, vp, {
    v: 2, anchor: 'TL', dx: defaultPosition.x, dy: defaultPosition.y, w: 240, h: 200
  })

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) return
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setIsDragging(true)
    const rect = target.getBoundingClientRect()
    dragStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !isDragging || !dragStartRef.current) return
    const GRID_SIZE = 10
    const snappedX = Math.round((e.clientX - dragStartRef.current.x) / GRID_SIZE) * GRID_SIZE
    const snappedY = Math.round((e.clientY - dragStartRef.current.y) / GRID_SIZE) * GRID_SIZE
    if (containerRef.current) {
      containerRef.current.style.left = `${snappedX}px`
      containerRef.current.style.top = `${snappedY}px`
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)

    if (containerRef.current && hudSettings) {
      // Merge onto the LATEST saved settings, never onto the prop (which can
      // carry config.lua overrides that must not be persisted).
      const rawSaved = localStorage.getItem('hudSettings')
      const baseSettings = rawSaved ? JSON.parse(rawSaved) : hudSettings

      const updatedSettings = {
        ...baseSettings,
        uiPositions: {
          ...(baseSettings.uiPositions || {}),
          // stored resolution-independently (design space + anchor)
          [positionKey]: writePosition(containerRef.current, vp, positionKey)
        }
      }

      if ((window as any).updateHudSettings) {
        (window as any).updateHudSettings(updatedSettings)
      }
      localStorage.setItem('hudSettings', JSON.stringify(updatedSettings))
      fetch(`https://${GetParentResourceName()}/saveHUDSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).catch(() => {})
    }

    dragStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      className="vehicle-hud-anchor"
      style={{
        left: `${savedPosition.left}px`,
        top: `${savedPosition.top}px`,
        cursor: positioningMode ? 'move' : 'default',
        outline: positioningMode ? '1px dashed rgba(245, 165, 36, 0.65)' : 'none',
        outlineOffset: '3px',
        boxShadow: positioningMode
          ? '0 0 0 1px rgba(0,0,0,0.5), 0 0 26px -6px rgba(245, 165, 36, 0.45)'
          : 'none',
        pointerEvents: positioningMode ? 'auto' : 'none',
        touchAction: 'none',
        zIndex: positioningMode ? 10000 : 1000
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  )
})

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
  /** Per-element toggles from Config.VehicleHUD */
  show?: Partial<VehicleHudVisibility>
  /** Positioning-mode support, same as every other HUD element */
  positioningMode?: boolean
  hudSettings?: any
}

const DEFAULT_SHOW: VehicleHudVisibility = {
  showSpeed: true,
  showFuel: true,
  showRPM: true,
  showGear: true,
  showDamage: true,
  showDoorWarning: true,
  showSeatbeltWarning: true,
  showEngineWarning: true
}

const VehicleHUD = ({ data, speedUnit = 'kmh', show, positioningMode, hudSettings }: VehicleHUDProps) => {
  if (!data.inVehicle && !positioningMode) return null

  const vis: VehicleHudVisibility = { ...DEFAULT_SHOW, ...(show || {}) }

  // Top-left by default, matching the margin the other HUD elements use
  const defaultPosition = { x: 20, y: 20 }

  // Convert speed based on unit
  const displaySpeed = speedUnit === 'mph'
    ? Math.floor(data.speed * 0.621371) // km/h to mph
    : Math.floor(data.speed)

  // Determine if engine is critically damaged
  const engineCritical = data.engineHealth < 40

  return (
    <DraggableVehicleWrapper
      positioningMode={positioningMode}
      hudSettings={hudSettings}
      defaultPosition={defaultPosition}
    >
      <div className="vehicle-speedometer">
        {/* Fuel Bar - Config.VehicleHUD.showFuel */}
        {vis.showFuel && (
          <div className="fuel-bar-container">
            <i className="mdi mdi-gas-station fuel-icon"></i>
            <div className="fuel-bar-bg">
              <div
                className="fuel-bar-fill"
                style={{ width: `${data.fuel}%` }}
              />
            </div>
          </div>
        )}

        {/* Warning Icons - each has its own Config.VehicleHUD toggle */}
        {(vis.showSeatbeltWarning || vis.showDamage || vis.showDoorWarning) && (
          <div className="warning-icons">
            {vis.showSeatbeltWarning && (
              <div className={`warning-icon ${data.seatbelt ? 'active' : 'blink'}`}>
                <i className="mdi mdi-seatbelt"></i>
              </div>
            )}
            {vis.showDamage && (
              <div className={`warning-icon ${engineCritical ? 'active blink' : ''}`}>
                <i className="mdi mdi-wrench"></i>
              </div>
            )}
            {vis.showDoorWarning && (
              <div className={`warning-icon ${data.doorOpen ? 'active' : ''}`}>
                <i className="mdi mdi-car-door"></i>
              </div>
            )}
          </div>
        )}

        {/* Speed Display - Config.VehicleHUD.showSpeed */}
        {vis.showSpeed && (
          <div className="speed-display">
            <div className="speed-box">
              <div className="speed-number">{displaySpeed}</div>
            </div>
            <div className="speed-unit-label">{speedUnit.toUpperCase()}</div>
          </div>
        )}

        {/* Gear Numbers - Config.VehicleHUD.showGear */}
        {vis.showGear && (
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
        )}
      </div>
    </DraggableVehicleWrapper>
  )
}

export default VehicleHUD
