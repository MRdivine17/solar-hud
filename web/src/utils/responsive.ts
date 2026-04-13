// Responsive utility functions for HUD positioning

export interface ResponsivePosition {
  x: number
  y: number
}

// Detect aspect ratio type
export const getAspectRatioType = (): 'standard' | 'wide' | 'ultrawide' | 'superultrawide' => {
  const aspectRatio = window.innerWidth / window.innerHeight
  
  if (aspectRatio >= 3.5) return 'superultrawide' // 32:9 (3.56)
  if (aspectRatio >= 2.3) return 'ultrawide' // 21:9 (2.37)
  if (aspectRatio >= 1.7) return 'wide' // 16:9 (1.78)
  return 'standard' // 16:10, 4:3, etc
}

// Get responsive scale factor based on current resolution
export const getResponsiveScale = (): number => {
  const width = window.innerWidth
  const height = window.innerHeight
  
  // Base resolution: 1920x1080
  const baseWidth = 1920
  const baseHeight = 1080
  
  // Calculate scale factors for both dimensions
  const widthScale = width / baseWidth
  const heightScale = height / baseHeight
  
  // Use height scale for ultra-wide to prevent elements from being too far apart
  const aspectType = getAspectRatioType()
  if (aspectType === 'ultrawide' || aspectType === 'superultrawide') {
    return heightScale // Scale based on height only for ultra-wide
  }
  
  // Use the smaller scale to ensure everything fits without overflow
  return Math.min(widthScale, heightScale)
}

// Convert absolute position to responsive position
export const getResponsivePosition = (baseX: number, baseY: number): ResponsivePosition => {
  const scale = getResponsiveScale()
  const scaledX = Math.round(baseX * scale)
  const scaledY = Math.round(baseY * scale)
  
  // For ultra-wide, add extra margin to left-aligned elements to keep them visible
  const aspectType = getAspectRatioType()
  const extraMargin = aspectType === 'superultrawide' ? 100 : aspectType === 'ultrawide' ? 50 : 0
  
  return {
    x: scaledX + extraMargin,
    y: scaledY
  }
}

// Get position from right edge (for right-aligned elements)
export const getPositionFromRight = (offsetFromRight: number, baseY: number): ResponsivePosition => {
  const scale = getResponsiveScale()
  const scaledOffset = Math.round(offsetFromRight * scale)
  const scaledY = Math.round(baseY * scale)
  
  // For ultra-wide, add extra margin to keep elements visible
  const aspectType = getAspectRatioType()
  const extraMargin = aspectType === 'superultrawide' ? 100 : aspectType === 'ultrawide' ? 50 : 0
  
  return {
    x: window.innerWidth - scaledOffset - extraMargin,
    y: scaledY
  }
}

// Get position from bottom edge (for bottom-aligned elements)
export const getPositionFromBottom = (baseX: number, offsetFromBottom: number): ResponsivePosition => {
  const scale = getResponsiveScale()
  const scaledX = Math.round(baseX * scale)
  const scaledOffset = Math.round(offsetFromBottom * scale)
  
  return {
    x: scaledX,
    y: window.innerHeight - scaledOffset
  }
}

// Get position from bottom-right corner
export const getPositionFromBottomRight = (offsetFromRight: number, offsetFromBottom: number): ResponsivePosition => {
  const scale = getResponsiveScale()
  const scaledOffsetX = Math.round(offsetFromRight * scale)
  const scaledOffsetY = Math.round(offsetFromBottom * scale)
  
  // For ultra-wide, add extra margin to keep elements visible
  const aspectType = getAspectRatioType()
  const extraMargin = aspectType === 'superultrawide' ? 100 : aspectType === 'ultrawide' ? 50 : 0
  
  return {
    x: window.innerWidth - scaledOffsetX - extraMargin,
    y: window.innerHeight - scaledOffsetY
  }
}

// Check if current resolution is considered "low"
export const isLowResolution = (): boolean => {
  return window.innerWidth <= 1366 || window.innerHeight <= 768
}

// Check if current display is ultra-wide
export const isUltraWide = (): boolean => {
  const aspectType = getAspectRatioType()
  return aspectType === 'ultrawide' || aspectType === 'superultrawide'
}

// Get safe zone margins for ultra-wide displays
export const getSafeZoneMargins = () => {
  const aspectType = getAspectRatioType()
  
  return {
    left: aspectType === 'superultrawide' ? 100 : aspectType === 'ultrawide' ? 50 : 0,
    right: aspectType === 'superultrawide' ? 100 : aspectType === 'ultrawide' ? 50 : 0,
    top: 0,
    bottom: 0
  }
}

// Get responsive font size multiplier
export const getResponsiveFontScale = (): number => {
  const width = window.innerWidth
  const height = window.innerHeight
  
  if (width <= 1280 || height <= 720) return 0.85
  if (width <= 1366 || height <= 768) return 0.9
  if (width <= 1600 || height <= 900) return 0.95
  return 1.0
}

// Apply responsive scaling to CSS size values
export const getResponsiveSize = (baseSize: number): number => {
  const scale = getResponsiveScale()
  return Math.round(baseSize * scale)
}

// Get viewport percentage for width
export const getVW = (pixels: number, baseWidth: number = 1920): string => {
  return `${(pixels / baseWidth) * 100}vw`
}

// Get viewport percentage for height
export const getVH = (pixels: number, baseHeight: number = 1080): string => {
  return `${(pixels / baseHeight) * 100}vh`
}

// Convert pixel position to viewport percentage (for cross-resolution compatibility)
export const pixelToViewportPercent = (pixelX: number, pixelY: number, baseWidth: number = 1920, baseHeight: number = 1080) => {
  return {
    x: (pixelX / baseWidth) * 100,
    y: (pixelY / baseHeight) * 100
  }
}

// Convert viewport percentage to pixels for current resolution
export const viewportPercentToPixel = (xPercent: number, yPercent: number) => {
  return {
    x: (xPercent / 100) * window.innerWidth,
    y: (yPercent / 100) * window.innerHeight
  }
}

// Normalize position - converts old pixel positions to viewport percentages
export const normalizePosition = (pos: { x: number, y: number }, baseWidth: number = 1920, baseHeight: number = 1080) => {
  // If position seems to be in pixels (> 100), convert to percentage based on base resolution
  if (pos.x > 100 || pos.y > 100) {
    return {
      x: (pos.x / baseWidth) * 100,
      y: (pos.y / baseHeight) * 100
    }
  }
  // Already in percentage format
  return pos
}

// Apply responsive position - converts percentage to current viewport pixels
export const applyResponsivePosition = (pos: { x: number, y: number }) => {
  const normalized = normalizePosition(pos)
  return viewportPercentToPixel(normalized.x, normalized.y)
}
