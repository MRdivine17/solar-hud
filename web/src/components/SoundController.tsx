import { useEffect, useRef } from 'react'
import { soundManager } from '../utils/SoundManager'

interface SoundControllerProps {
  seatbelt: boolean
  inVehicle: boolean
  speed: number
  indicators?: {
    left: boolean
    right: boolean
    hazard: boolean
  }
  isStalling?: boolean
  seatbeltSoundsEnabled?: boolean // New prop to control seatbelt sounds
}

const SoundController = ({ 
  seatbelt, 
  inVehicle, 
  speed, 
  indicators,
  isStalling = false,
  seatbeltSoundsEnabled = true // Default to enabled
}: SoundControllerProps) => {
  const prevSeatbelt = useRef<boolean>(seatbelt)
  const prevIndicators = useRef(indicators)
  const prevStalling = useRef<boolean>(isStalling)
  const alarmActive = useRef<boolean>(false)

  // Test sound on mount (only in dev mode)
  useEffect(() => {
    // console.log('[SoundController] Component mounted')
    
    // Add click listener to enable audio (browser requirement)
    const enableAudio = () => {
      // console.log('[SoundController] User interaction detected, audio enabled')
      document.removeEventListener('click', enableAudio)
    }
    document.addEventListener('click', enableAudio)
    
    return () => {
      document.removeEventListener('click', enableAudio)
      // Clean up all sounds on unmount
      soundManager.stopAll()
    }
  }, [])

  // Seatbelt sound effects - CLIENT-SIDE ONLY
  useEffect(() => {
    // Only play seatbelt toggle sounds when in vehicle AND sounds are enabled
    if (inVehicle && seatbeltSoundsEnabled) {
      // Seatbelt put on - play sound
      if (!prevSeatbelt.current && seatbelt) {
        soundManager.playOnce('seatbelt-on')
        // Stop alarm immediately when seatbelt is fastened
        if (alarmActive.current) {
          soundManager.stopLoop('seatbelt-alarm')
          alarmActive.current = false
        }
      }
      
      // Seatbelt removed - play sound
      if (prevSeatbelt.current && !seatbelt) {
        soundManager.playOnce('seatbelt-off')
      }
    }

    prevSeatbelt.current = seatbelt
  }, [seatbelt, inVehicle, seatbeltSoundsEnabled])

  // Seatbelt alarm - ONLY plays when: in vehicle, moving (>5 speed), seatbelt OFF, AND sounds enabled
  useEffect(() => {
    const shouldPlayAlarm = inVehicle && !seatbelt && speed > 5 && seatbeltSoundsEnabled

    if (shouldPlayAlarm && !alarmActive.current) {
      // Start alarm
      soundManager.playLoop('seatbelt-alarm')
      alarmActive.current = true
    } else if ((!shouldPlayAlarm || !seatbeltSoundsEnabled) && alarmActive.current) {
      // Stop alarm (either conditions not met OR sounds disabled)
      soundManager.stopLoop('seatbelt-alarm')
      alarmActive.current = false
    }

    // Cleanup on unmount or when leaving vehicle
    return () => {
      if (!inVehicle && alarmActive.current) {
        soundManager.stopLoop('seatbelt-alarm')
        alarmActive.current = false
      }
    }
  }, [seatbelt, inVehicle, speed, seatbeltSoundsEnabled])

  // Indicator sounds - loop while any indicator is active
  useEffect(() => {
    if (inVehicle && indicators) {
      const indicatorActive = indicators.left || indicators.right || indicators.hazard
      const prevIndicatorActive = prevIndicators.current 
        ? (prevIndicators.current.left || prevIndicators.current.right || prevIndicators.current.hazard)
        : false

      // Start loop when indicator turns on
      if (indicatorActive && !prevIndicatorActive) {
        // console.log('[SoundController] Indicator activated - starting loop')
        soundManager.playLoop('indicator')
      } 
      // Stop loop when indicator turns off
      else if (!indicatorActive && prevIndicatorActive) {
        // console.log('[SoundController] Indicator deactivated - stopping loop')
        soundManager.stopLoop('indicator')
      }
    } else {
      // Not in vehicle - stop indicator sound
      soundManager.stopLoop('indicator')
    }

    prevIndicators.current = indicators
  }, [indicators, inVehicle])

  // Stall warning for aircraft - loop continuously while stalling
  useEffect(() => {
    if (isStalling && !prevStalling.current) {
      // Started stalling - start loop
      // console.log('[SoundController] Aircraft stalling - starting stall warning loop')
      soundManager.playLoop('airbus_stall_warning')
    } else if (!isStalling && prevStalling.current) {
      // Stopped stalling - stop loop
      // console.log('[SoundController] Aircraft recovered - stopping stall warning')
      soundManager.stopLoop('airbus_stall_warning')
    }

    prevStalling.current = isStalling
  }, [isStalling])

  return null // This component doesn't render anything
}

export default SoundController
