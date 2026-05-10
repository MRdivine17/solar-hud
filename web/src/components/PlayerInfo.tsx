import { memo, useRef, useState } from 'react'
import * as React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHashtag, faClock, faBriefcase, faMoneyBill, faUniversity, faSuitcase, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons'
import { PlayerInfo as PlayerInfoType, MoneyData, TimeData, VoiceData, PlayerInfoSettings } from '../types'
import { getPositionFromRight } from '../utils/responsive'
import './PlayerInfo.css'

interface PlayerInfoProps {
  playerInfo: PlayerInfoType
  money: MoneyData
  time: TimeData
  voice: VoiceData
  settings?: PlayerInfoSettings
  positioningMode?: boolean
  hudSettings?: any
}

// Helper functions
const GetParentResourceName = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'solar-hud'
  }
  return (window as any).GetParentResourceName ? (window as any).GetParentResourceName() : 'solar-hud'
}

const formatMoney = (amount: number) => {
  return amount.toLocaleString('en-US')
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`
}

// Individual Card Component for separate dragging and resizing
const PlayerInfoCard = memo(({ 
  children, 
  positioningMode, 
  hudSettings, 
  cardId, 
  layoutStyle,
  defaultPosition,
  width = 200,
  height = 80
}: {
  children: React.ReactNode
  positioningMode?: boolean
  hudSettings?: any
  cardId: string
  layoutStyle: string
  defaultPosition: { x: number; y: number }
  width?: number
  height?: number
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const resizeStartRef = useRef<{ scale: number; mouseX: number; mouseY: number } | null>(null)

  // Get layout-specific position key
  const positionKey = `${cardId}_${layoutStyle}`
  
  // Get position from settings or use default
  const savedPosition = hudSettings?.uiPositions?.[positionKey] || defaultPosition
  
  // Get current scale from playerInfo settings
  const currentScale = hudSettings?.playerInfo?.scale || 100

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) return
    
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setIsDragging(true)
    
    const rect = target.getBoundingClientRect()
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    e.preventDefault()
    e.stopPropagation()
  }

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !isDragging || !dragStartRef.current) return
    
    const newX = e.clientX - dragStartRef.current.x
    const newY = e.clientY - dragStartRef.current.y

    // Grid snapping (10px grid)
    const GRID_SIZE = 10
    const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE
    const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE

    // Update position directly via DOM for smooth dragging
    if (containerRef.current) {
      containerRef.current.style.left = `${snappedX}px`
      containerRef.current.style.top = `${snappedY}px`
    }
  }

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging) return
    
    const target = e.currentTarget
    target.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    
    // Save position immediately
    if (containerRef.current && hudSettings) {
      const rect = containerRef.current.getBoundingClientRect()
      const finalX = rect.left
      const finalY = rect.top
      
      const updatedSettings = {
        ...hudSettings,
        uiPositions: {
          ...(hudSettings.uiPositions || {}),
          [positionKey]: {
            x: finalX,
            y: finalY,
            width: width,
            height: height
          }
        }
      }
      
      // Update parent state via callback
      if ((window as any).updateHudSettings) {
        (window as any).updateHudSettings(updatedSettings)
      }
      
      // Save to localStorage immediately
      localStorage.setItem('hudSettings', JSON.stringify(updatedSettings))
      
      // Send to Lua server immediately
      fetch(`https://${GetParentResourceName()}/saveHUDSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).catch(() => {})
      
      console.log(`[${positionKey}] Position saved to localStorage:`, { x: finalX, y: finalY })
    }
    
    dragStartRef.current = null
  }

  // Resize handle handlers
  const handleResizeStart: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!positioningMode || !hudSettings) return
    
    e.stopPropagation() // Prevent dragging when resizing
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    setIsResizing(true)
    
    resizeStartRef.current = {
      scale: currentScale,
      mouseX: e.clientX,
      mouseY: e.clientY
    }
    
    e.preventDefault()
  }

  const handleResizeMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isResizing || !resizeStartRef.current || !hudSettings) return
    
    // Calculate distance moved (use diagonal distance for more intuitive scaling)
    const deltaX = e.clientX - resizeStartRef.current.mouseX
    const deltaY = e.clientY - resizeStartRef.current.mouseY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const direction = (deltaX + deltaY) > 0 ? 1 : -1
    
    // Scale factor: 1px movement = 0.5% scale change
    const scaleChange = (distance * direction) * 0.5
    let newScale = resizeStartRef.current.scale + scaleChange
    
    // Clamp between 70 and 130
    newScale = Math.max(70, Math.min(130, newScale))
    
    // Update settings immediately (React state only - no server call)
    const updatedSettings = {
      ...hudSettings,
      playerInfo: {
        ...(hudSettings.playerInfo || {}),
        scale: Math.round(newScale)
      }
    }
    
    // Update parent state via callback (local only)
    if ((window as any).updateHudSettings) {
      (window as any).updateHudSettings(updatedSettings)
    }
  }

  const handleResizeEnd: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isResizing) return
    
    const target = e.currentTarget
    target.releasePointerCapture(e.pointerId)
    setIsResizing(false)
    
    // Save to localStorage and Lua ONLY on drag end (not during movement).
    // Read the LATEST settings from localStorage (resize updates were already
    // pushed there via window.updateHudSettings during pointer move) — never
    // trust the stale prop closure, which holds the scale from pointer-down.
    if (hudSettings) {
      const raw = localStorage.getItem('hudSettings')
      const finalSettings = raw ? JSON.parse(raw) : hudSettings

      // Save to Lua server ONCE after resize completes
      fetch(`https://${GetParentResourceName()}/saveHUDSettings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSettings)
      }).catch(() => {})

      console.log(`[${positionKey}] Scale saved:`, finalSettings.playerInfo?.scale)
    }
    
    resizeStartRef.current = null
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: `${savedPosition.x}px`,
        top: `${savedPosition.y}px`,
        cursor: positioningMode ? 'move' : 'default',
        outline: positioningMode ? '3px solid rgba(59, 130, 246, 0.8)' : 'none',
        outlineOffset: '3px',
        boxShadow: positioningMode ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
        pointerEvents: positioningMode ? 'auto' : 'none',
        touchAction: 'none',
        zIndex: positioningMode ? 10000 : 'auto',
        transition: positioningMode ? 'none' : 'all 0.2s ease'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
      
      {/* Resize Handle - Bottom Right Corner */}
      {positioningMode && (
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '-6px',
            width: '20px',
            height: '20px',
            background: 'rgba(59, 130, 246, 0.9)',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'nwse-resize',
            zIndex: 10001,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ pointerEvents: 'none' }}>
            <path d="M 10 2 L 2 10 M 10 6 L 6 10 M 10 10 L 10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
})

// Voice Mode Indicator - Straight vertical bars showing whisper/normal/shout
const VoiceModeIndicator = memo(({ mode, color = '#00ff00' }: { mode: number; color?: string }) => {
  // mode: 1 = whisper, 2 = normal, 3 = shout
  const bars = [
    { height: 6, active: mode >= 1 },   // First bar - whisper+
    { height: 10, active: mode >= 2 },  // Second bar - normal+
    { height: 14, active: mode >= 3 }   // Third bar - shout only
  ]
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${bar.height}px`,
            background: bar.active ? color : 'rgba(255, 255, 255, 0.15)',
            borderRadius: '1px',
            transition: 'all 0.15s ease'
          }}
        />
      ))}
    </div>
  )
})

// Speaking Animation - Straight vertical bars that move when talking
const SpeakingAnimation = memo(({ talking, color = '#00ff00' }: { talking: boolean; color?: string }) => {
  const bars = [3, 5, 4, 6, 5, 7, 4, 5]
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', height: '14px' }}>
      {bars.map((height, i) => (
        <div
          key={i}
          style={{
            width: '2.5px',
            height: talking ? `${height * 2}px` : '3px',
            background: color,
            borderRadius: '1px',
            transition: 'height 0.12s ease',
            animation: talking ? `speakingWave ${0.4 + (i * 0.06)}s ease-in-out infinite alternate` : 'none'
          }}
        />
      ))}
      <style>{`
        @keyframes speakingWave {
          0% { height: 3px; opacity: 0.7; }
          100% { height: 14px; opacity: 1; }
        }
      `}</style>
    </div>
  )
})

const PlayerInfo = memo(({ playerInfo, money, time, voice, settings, positioningMode, hudSettings }: PlayerInfoProps) => {
  // Default settings
  const defaultColors = {
    iconColor: '#ffffff',
    textColor: '#ffffff',
    labelColor: '#999999',
    bgColor: '#0a0a0a'
  }
  
  const defaultSettings: PlayerInfoSettings = {
    enabled: true,
    layoutStyle: 'miniature',
    cardStyle: 'rounded',
    themeMode: 'dark',
    bgColor: '#000000',
    iconBgColor: '#1a1a1a',
    contentBgColor: '#0a0a0a',
    transparency: 85,
    position: { x: 12, y: 12 },
    scale: 100,
    showId: true,
    showTime: true,
    showJob: true,
    showBank: true,
    showCash: true,
    showDirty: false,
    showVoice: true,
    showWeather: true,
    showServerInfo: true,
    serverName: 'Server Name',
    serverLogo: '',
    weatherIconType: 'fontawesome',
    weatherIconPath: '',
    showLogo: false,
    logoScale: 100,
    logoPosition: { x: 50, y: 10 },
    idColors: defaultColors,
    timeColors: defaultColors,
    jobColors: defaultColors,
    bankColors: defaultColors,
    cashColors: defaultColors,
    dirtyColors: defaultColors,
    voiceColors: { ...defaultColors, iconColor: '#00ff00', textColor: '#00ff00' }
  }

  const safeSettings = { ...defaultSettings, ...settings }
  const bgOpacity = safeSettings.transparency
  const layoutStyle = safeSettings.layoutStyle || 'miniature'
  const scale = (safeSettings.scale || 100) / 100 // Convert percentage to decimal (e.g., 100 -> 1.0, 130 -> 1.3)

  // Debug: Log voice data to console
  if (voice.radioChannel && voice.radioChannel > 0) {
    // console.log('[PlayerInfo] 📡 Radio channel detected:', voice.radioChannel, 'MHz')
  }

  if (!safeSettings.enabled) return null

  // Get card style properties
  const getCardStyle = () => {
    const style = safeSettings.cardStyle
    
    if (style === 'rounded') {
      return { clipPath: 'none', borderRadius: '8px' }
    } else if (style === 'square') {
      return { clipPath: 'none', borderRadius: '0px' }
    } else if (style === 'angled') {
      return {
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)',
        borderRadius: '8px 0 0 8px'
      }
    } else if (style === 'hexagon') {
      return {
        clipPath: 'polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)',
        borderRadius: '0'
      }
    }
    
    return { clipPath: 'none', borderRadius: '8px' }
  }

  const cardStyleProps = getCardStyle()

  // Modern HUD Layout - Icon squares separated from info rectangles
  if (layoutStyle === 'modern') {
    return (
      <>
        {/* Time Card */}
        {safeSettings.showTime && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="timeCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(230, 20)}
            width={220}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.timeColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.timeColors.textColor }}>{time.time}</span>
                <span className="mov-info-label" style={{ color: safeSettings.timeColors.labelColor }}>Server Time</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.timeColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faClock} style={{ color: safeSettings.timeColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* Job Card */}
        {safeSettings.showJob && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="jobCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(220, 90)}
            width={200}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.jobColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.jobColors.textColor }}>{playerInfo.job}</span>
                <span className="mov-info-label" style={{ color: safeSettings.jobColors.labelColor }}>Job</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.jobColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faBriefcase} style={{ color: safeSettings.jobColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* Bank Card */}
        {safeSettings.showBank && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="bankCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(220, 160)}
            width={200}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.bankColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.bankColors.textColor }}>${formatMoney(money.bank)}</span>
                <span className="mov-info-label" style={{ color: safeSettings.bankColors.labelColor }}>Bank</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.bankColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faUniversity} style={{ color: safeSettings.bankColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* Cash Card */}
        {safeSettings.showCash && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="cashCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(220, 230)}
            width={200}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.cashColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.cashColors.textColor }}>${formatMoney(money.cash)}</span>
                <span className="mov-info-label" style={{ color: safeSettings.cashColors.labelColor }}>Cash</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.cashColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faMoneyBill} style={{ color: safeSettings.cashColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* Dirty Money Card */}
        {safeSettings.showDirty && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="dirtyCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(220, 300)}
            width={200}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.dirtyColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.dirtyColors.textColor }}>${formatMoney(money.dirty)}</span>
                <span className="mov-info-label" style={{ color: safeSettings.dirtyColors.labelColor }}>Dirty</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.dirtyColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faSuitcase} style={{ color: safeSettings.dirtyColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* ID Card */}
        {safeSettings.showId && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="idCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(220, 370)}
            width={200}
            height={60}
          >
            <div className="mov-card-row" style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="mov-info-rect" style={{ background: hexToRgba(safeSettings.idColors.bgColor, bgOpacity), ...cardStyleProps }}>
                <span className="mov-info-value" style={{ color: safeSettings.idColors.textColor }}>{playerInfo.serverId}</span>
                <span className="mov-info-label" style={{ color: safeSettings.idColors.labelColor }}>ID</span>
              </div>
              <div className="mov-icon-square" style={{ background: hexToRgba(safeSettings.idColors.iconBgColor || safeSettings.iconBgColor, bgOpacity), ...cardStyleProps }}>
                <FontAwesomeIcon icon={faHashtag} style={{ color: safeSettings.idColors.iconColor, fontSize: '21px' }} />
              </div>
            </div>
          </PlayerInfoCard>
        )}

        {/* Voice Card - Modern Layout (Single Line, Compact) */}
        {safeSettings.showVoice && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="voiceCard"
            layoutStyle="modern"
            defaultPosition={getPositionFromRight(280, 440)}
            width={260}
            height={45}
          >
            <div style={{ 
              background: hexToRgba(safeSettings.voiceColors.bgColor, bgOpacity), 
              ...cardStyleProps,
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 12px',
              height: '45px',
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}>
              {/* Microphone Icon */}
              <FontAwesomeIcon 
                icon={(voice.talking || voice.radioTalking) ? faMicrophone : faMicrophoneSlash} 
                style={{ 
                  color: (voice.talking || voice.radioTalking) ? safeSettings.voiceColors.iconColor : 'rgba(255, 255, 255, 0.3)', 
                  fontSize: '16px',
                  transition: 'color 0.15s ease',
                  minWidth: '16px'
                }} 
              />
              
              {/* Voice Mode Indicator */}
              <VoiceModeIndicator mode={voice.mode || 2} color={safeSettings.voiceColors.iconColor} />
              
              {/* Speaking Animation */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '50px' }}>
                {(voice.talking || voice.radioTalking) ? (
                  <SpeakingAnimation talking={true} color={safeSettings.voiceColors.iconColor} />
                ) : (
                  <div style={{ width: '50px', height: '2px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '1px' }} />
                )}
              </div>
              
              {/* Radio Frequency - Small Round Circle Badge */}
              {voice.radioChannel && voice.radioChannel > 0 && (
                <div style={{ 
                  background: hexToRgba(safeSettings.voiceColors.iconColor, 25), 
                  padding: '4px 9px', 
                  borderRadius: '50px', 
                  fontSize: '10px', 
                  fontWeight: '700',
                  color: '#ffffff',
                  border: `1.5px solid ${hexToRgba(safeSettings.voiceColors.iconColor, 50)}`,
                  minWidth: '45px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px'
                }}>
                  {voice.radioChannel} MHz
                </div>
              )}
            </div>
          </PlayerInfoCard>
        )}
      </>
    )
  }

  // Grid Layout - Icon on LEFT, details on RIGHT with accent bar
  if (layoutStyle === 'grid') {
    return (
      <>
        {/* Time Card */}
        {safeSettings.showTime && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="timeCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 20)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.timeColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.timeColors.iconColor }}></div>
              <FontAwesomeIcon icon={faClock} style={{ color: safeSettings.timeColors.iconColor }} />
              <span style={{ color: safeSettings.timeColors.textColor }}>{time.time}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* Job Card */}
        {safeSettings.showJob && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="jobCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 80)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.jobColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.jobColors.iconColor }}></div>
              <FontAwesomeIcon icon={faBriefcase} style={{ color: safeSettings.jobColors.iconColor }} />
              <span style={{ color: safeSettings.jobColors.textColor }}>JOB: {playerInfo.job}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* Bank Card */}
        {safeSettings.showBank && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="bankCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 140)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.bankColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.bankColors.iconColor }}></div>
              <FontAwesomeIcon icon={faUniversity} style={{ color: safeSettings.bankColors.iconColor }} />
              <span style={{ color: safeSettings.bankColors.textColor }}>BANK: ${formatMoney(money.bank)}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* Cash Card */}
        {safeSettings.showCash && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="cashCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 200)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.cashColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.cashColors.iconColor }}></div>
              <FontAwesomeIcon icon={faMoneyBill} style={{ color: safeSettings.cashColors.iconColor }} />
              <span style={{ color: safeSettings.cashColors.textColor }}>CASH: ${formatMoney(money.cash)}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* Dirty Money Card */}
        {safeSettings.showDirty && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="dirtyCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 260)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.dirtyColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.dirtyColors.iconColor }}></div>
              <FontAwesomeIcon icon={faSuitcase} style={{ color: safeSettings.dirtyColors.iconColor }} />
              <span style={{ color: safeSettings.dirtyColors.textColor }}>DIRTY: ${formatMoney(money.dirty)}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* ID Card */}
        {safeSettings.showId && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="idCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(200, 320)}
            width={180}
            height={50}
          >
            <div className="grid-info-card" style={{ background: hexToRgba(safeSettings.idColors.bgColor, bgOpacity), ...cardStyleProps, transform: `scale(${scale})`, transformOrigin: 'top right' }}>
              <div className="grid-card-accent" style={{ background: safeSettings.idColors.iconColor }}></div>
              <FontAwesomeIcon icon={faHashtag} style={{ color: safeSettings.idColors.iconColor }} />
              <span style={{ color: safeSettings.idColors.textColor }}>ID: {playerInfo.serverId}</span>
            </div>
          </PlayerInfoCard>
        )}

        {/* Voice Card - Grid Layout (Single Line, Compact) */}
        {safeSettings.showVoice && (
          <PlayerInfoCard
            positioningMode={positioningMode}
            hudSettings={hudSettings}
            cardId="voiceCard"
            layoutStyle="grid"
            defaultPosition={getPositionFromRight(240, 380)}
            width={220}
            height={42}
          >
            <div className="grid-info-card" style={{ 
              background: hexToRgba(safeSettings.voiceColors.bgColor, bgOpacity), 
              ...cardStyleProps, 
              transform: `scale(${scale})`, 
              transformOrigin: 'top right', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '7px', 
              padding: '8px 10px',
              height: '42px'
            }}>
              <div className="grid-card-accent" style={{ background: safeSettings.voiceColors.iconColor }}></div>
              
              {/* Mic Icon */}
              <FontAwesomeIcon 
                icon={(voice.talking || voice.radioTalking) ? faMicrophone : faMicrophoneSlash} 
                style={{ 
                  color: (voice.talking || voice.radioTalking) ? safeSettings.voiceColors.iconColor : 'rgba(255, 255, 255, 0.3)',
                  fontSize: '14px',
                  transition: 'color 0.15s ease',
                  minWidth: '14px'
                }} 
              />
              
              {/* Voice Mode Indicator */}
              <div style={{ transform: 'scale(0.9)' }}>
                <VoiceModeIndicator mode={voice.mode || 2} color={safeSettings.voiceColors.iconColor} />
              </div>
              
              {/* Speaking Animation */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
                {(voice.talking || voice.radioTalking) ? (
                  <div style={{ transform: 'scale(0.9)' }}>
                    <SpeakingAnimation talking={true} color={safeSettings.voiceColors.iconColor} />
                  </div>
                ) : (
                  <div style={{ width: '40px', height: '2px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '1px' }} />
                )}
              </div>
              
              {/* Radio Frequency - Small Round Circle Badge */}
              {voice.radioChannel && voice.radioChannel > 0 && (
                <div style={{ 
                  background: hexToRgba(safeSettings.voiceColors.iconColor, 25), 
                  padding: '3px 8px', 
                  borderRadius: '50px', 
                  fontSize: '9px', 
                  fontWeight: '700',
                  color: '#ffffff',
                  border: `1.5px solid ${hexToRgba(safeSettings.voiceColors.iconColor, 50)}`,
                  minWidth: '42px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px'
                }}>
                  {voice.radioChannel} MHz
                </div>
              )}
            </div>
          </PlayerInfoCard>
        )}
      </>
    )
  }

  // Miniature Layout - Compact cards
  return (
    <>
      {/* Time Card */}
      {safeSettings.showTime && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="timeCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(140, 20)}
          width={120}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.timeColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faClock} style={{ color: safeSettings.timeColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.timeColors.textColor, fontSize: '12px', fontWeight: '500' }}>
              {time.time}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* Job Card */}
      {safeSettings.showJob && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="jobCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(170, 70)}
          width={150}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.jobColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faBriefcase} style={{ color: safeSettings.jobColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.jobColors.textColor, fontSize: '12px', fontWeight: '500' }}>
              {playerInfo.job}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* Bank Card */}
      {safeSettings.showBank && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="bankCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(160, 120)}
          width={140}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.bankColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faUniversity} style={{ color: safeSettings.bankColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.bankColors.textColor, fontSize: '12px', fontWeight: '600' }}>
              ${formatMoney(money.bank)}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* Cash Card */}
      {safeSettings.showCash && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="cashCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(160, 170)}
          width={140}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.cashColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faMoneyBill} style={{ color: safeSettings.cashColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.cashColors.textColor, fontSize: '12px', fontWeight: '600' }}>
              ${formatMoney(money.cash)}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* Dirty Money Card */}
      {safeSettings.showDirty && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="dirtyCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(160, 220)}
          width={140}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.dirtyColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faSuitcase} style={{ color: safeSettings.dirtyColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.dirtyColors.textColor, fontSize: '12px', fontWeight: '600' }}>
              ${formatMoney(money.dirty)}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* ID Card */}
      {safeSettings.showId && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="idCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(120, 270)}
          width={100}
          height={40}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.idColors.bgColor, bgOpacity),
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            <FontAwesomeIcon icon={faHashtag} style={{ color: safeSettings.idColors.iconColor, fontSize: '12px' }} />
            <span style={{ color: safeSettings.idColors.textColor, fontSize: '12px', fontWeight: '600' }}>
              {playerInfo.serverId}
            </span>
          </div>
        </PlayerInfoCard>
      )}

      {/* Voice Card - Miniature Layout (Single Line, Ultra Compact) */}
      {safeSettings.showVoice && (
        <PlayerInfoCard
          positioningMode={positioningMode}
          hudSettings={hudSettings}
          cardId="voiceCard"
          layoutStyle="miniature"
          defaultPosition={getPositionFromRight(180, 320)}
          width={160}
          height={36}
        >
          <div 
            className="miniature-card" 
            style={{ 
              background: hexToRgba(safeSettings.voiceColors.bgColor, bgOpacity),
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              height: '36px',
              ...cardStyleProps,
              transform: `scale(${scale})`,
              transformOrigin: 'top right'
            }}
          >
            {/* Mic Icon */}
            <FontAwesomeIcon 
              icon={(voice.talking || voice.radioTalking) ? faMicrophone : faMicrophoneSlash} 
              style={{ 
                color: (voice.talking || voice.radioTalking) ? safeSettings.voiceColors.iconColor : 'rgba(255, 255, 255, 0.3)', 
                fontSize: '11px',
                transition: 'color 0.15s ease',
                minWidth: '11px'
              }} 
            />
            
            {/* Voice Mode Indicator */}
            <div style={{ transform: 'scale(0.75)' }}>
              <VoiceModeIndicator mode={voice.mode || 2} color={safeSettings.voiceColors.iconColor} />
            </div>
            
            {/* Speaking Animation */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '30px' }}>
              {(voice.talking || voice.radioTalking) ? (
                <div style={{ transform: 'scale(0.7)' }}>
                  <SpeakingAnimation talking={true} color={safeSettings.voiceColors.iconColor} />
                </div>
              ) : (
                <div style={{ width: '30px', height: '1.5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '1px' }} />
              )}
            </div>
            
            {/* Radio Frequency - Small Round Circle Badge */}
            {voice.radioChannel && voice.radioChannel > 0 && (
              <div style={{ 
                background: hexToRgba(safeSettings.voiceColors.iconColor, 25), 
                padding: '3px 7px', 
                borderRadius: '50px', 
                fontSize: '8.5px', 
                fontWeight: '700',
                color: '#ffffff',
                border: `1.5px solid ${hexToRgba(safeSettings.voiceColors.iconColor, 50)}`,
                minWidth: '38px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: '0.2px'
              }}>
                {voice.radioChannel} MHz
              </div>
            )}
          </div>
        </PlayerInfoCard>
      )}
    </>
  )
})

export default PlayerInfo