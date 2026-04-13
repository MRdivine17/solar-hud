// Import audio files as modules (Vite will handle them)
import seatbeltOnSound from '../../img/sfx/seatbelt-on.mp3?url'
import seatbeltOffSound from '../../img/sfx/seatbelt-off.mp3?url'
import seatbeltAlarmSound from '../../img/sfx/seatbelt-alarm.mp3?url'
import indicatorSound from '../../img/sfx/indicator.mp3?url'
import airbusStallWarningSound from '../../img/sfx/airbus_stall_warning.mp3?url'

// Sound Manager - Uses HTML5 Audio elements for playback
class SoundManager {
  private audioElements: Map<string, HTMLAudioElement> = new Map()
  private loopingSounds: Set<string> = new Set()
  private volume: number = 0.3 // Low volume (30%)
  private initialized: boolean = false

  constructor() {
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init())
    } else {
      this.init()
    }
  }

  private init() {
    // Initialize sound manager
    // console.log('[Sound] Audio paths:', {
    //   seatbeltOn: seatbeltOnSound,
    //   seatbeltOff: seatbeltOffSound,
    //   seatbeltAlarm: seatbeltAlarmSound,
    //   indicator: indicatorSound,
    //   airbusStallWarning: airbusStallWarningSound
    // })
    
    // Create audio elements using imported URLs
    this.createAudioElement('seatbelt-on', seatbeltOnSound, false)
    this.createAudioElement('seatbelt-off', seatbeltOffSound, false)
    this.createAudioElement('seatbelt-alarm', seatbeltAlarmSound, true)
    this.createAudioElement('indicator', indicatorSound, true)
    this.createAudioElement('airbus_stall_warning', airbusStallWarningSound, true)
    
    this.initialized = true
    //console.log('[Sound] Sound manager initialized with', this.audioElements.size, 'sounds')
  }

  private createAudioElement(name: string, src: string, loop: boolean) {
   // console.log(`[Sound] Creating audio element for ${name} with src: ${src}`)
    const audio = new Audio(src)
    audio.volume = this.volume
    audio.preload = 'auto'
    if (loop) {
      audio.loop = true
    }
    
    // Add event listeners for debugging
    audio.addEventListener('canplaythrough', () => {
     // console.log(`[Sound] ${name} loaded and ready (src: ${src})`)
    })
    
    audio.addEventListener('error', () => {
      // Failed to load audio
    })
    
    this.audioElements.set(name, audio)
  }

  // Play sound once
  playOnce(name: string) {
    if (!this.initialized) {
      return
    }
    
    const audio = this.audioElements.get(name)
    if (audio) {
      //console.log(`[Sound] Playing ${name}`)
      audio.currentTime = 0
      audio.loop = false
      audio.play().catch(() => {})
    }
  }

  // Play sound continuously (loop)
  playLoop(name: string) {
    if (!this.initialized) {
      return
    }
    
    if (this.loopingSounds.has(name)) {
      return // Already looping
    }

    const audio = this.audioElements.get(name)
    if (audio) {
      audio.currentTime = 0
      audio.loop = true
      audio.play().catch(() => {})
      this.loopingSounds.add(name)
    }
  }

  // Stop looping sound
  stopLoop(name: string) {
    const audio = this.audioElements.get(name)
    if (audio && this.loopingSounds.has(name)) {
   //   console.log(`[Sound] Stopping loop ${name}`)
      audio.pause()
      audio.currentTime = 0
      this.loopingSounds.delete(name)
    }
  }

  // Stop all sounds
  stopAll() {
   // console.log('[Sound] Stopping all sounds')
    this.audioElements.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    this.loopingSounds.clear()
  }

  // Set volume for all sounds (0.0 to 1.0)
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audioElements.forEach((audio) => {
      audio.volume = this.volume
    })
  }
}

// Export singleton instance
export const soundManager = new SoundManager()
