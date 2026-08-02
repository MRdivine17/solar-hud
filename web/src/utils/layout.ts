/* ============================================================================
   SOLAR HUD - RESOLUTION-INDEPENDENT LAYOUT
   ----------------------------------------------------------------------------
   THE PROBLEM THIS REPLACES
   Positions used to be stored as raw viewport pixels captured at whatever
   resolution the player happened to be running. On any other resolution those
   numbers are meaningless: at 1280x720 a card saved at x=1700 sits 420px past
   the right edge, and because .hud-container is `overflow:hidden` it does not
   just hang off - it disappears completely.

   THE MODEL
   Every position is stored in a fixed DESIGN SPACE of 1920x1080, together with
   the anchor (which corner/edge of the screen it belongs to). At render time it
   is resolved against the live viewport:

       s      = min(W/1920, H/1080)          uniform scale, never distorts
       left   = anchorOriginX +/- dx * s     offset measured from ITS OWN edge
       width  = w * s                        elements scale with the screen

   WHY ANCHORING AND NOT PLAIN PERCENTAGES
   A HUD element's intent is not "at 87% across", it is "20px in from the right
   edge". With pure scaling a right-hugging element's gap to the edge grows
   without bound as the aspect widens - 220px at 1920x1080 becomes 1173px at
   3440x1440, dragging it into the middle of the screen. Anchoring keeps the
   gap at 220*s. Scaling fixes SIZE; anchoring fixes BELONGING.

   THE INVARIANT
   resolve(toStored(box, 1920x1080), 1920x1080) === box, exactly.
   1080p is bit-for-bit unchanged. Enforced by the test harness.
   ========================================================================= */

export const DESIGN_W = 1920
export const DESIGN_H = 1080

/** 8 design px of breathing room at the screen edge; scales with the viewport */
const SAFE_PAD = 8

export type AnchorX = 'L' | 'C' | 'R'
export type AnchorY = 'T' | 'M' | 'B'
export type Anchor = 'TL' | 'TC' | 'TR' | 'ML' | 'MC' | 'MR' | 'BL' | 'BC' | 'BR'

export interface Viewport {
  w: number
  h: number
  /** uniform scale vs the 1920x1080 design space */
  s: number
}

/** A position as persisted. Resolution independent. */
export interface StoredPosition {
  v: 2
  anchor: Anchor
  /** design-space offset from the anchored edge (or from centre for C/M) */
  dx: number
  dy: number
  /** design-space size */
  w: number
  h: number
  /** allow the element to hang off the edge (GTA's minimap sits at negative x) */
  bleed?: boolean
}

export interface Rect {
  left: number
  top: number
  width: number
  height: number
}

/* ---------------------------------------------------------------------------
   Viewport
--------------------------------------------------------------------------- */

export const getScale = (w: number, h: number) =>
  Math.min(w / DESIGN_W, h / DESIGN_H)

export const makeViewport = (w: number, h: number): Viewport => ({
  w,
  h,
  s: getScale(w, h)
})

export const readViewport = (): Viewport =>
  typeof window === 'undefined'
    ? makeViewport(DESIGN_W, DESIGN_H)
    : makeViewport(window.innerWidth, window.innerHeight)

/* ---------------------------------------------------------------------------
   Core transforms
--------------------------------------------------------------------------- */

const clampNum = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

/** design-space viewport dimensions for the current screen */
const designViewport = (vp: Viewport) => ({ VW: vp.w / vp.s, VH: vp.h / vp.s })

/**
 * Screen rect -> resolution-independent record.
 * `box` is in CURRENT viewport pixels.
 */
export function toStored(
  box: Rect,
  vp: Viewport,
  opts: { anchor?: Anchor; bleed?: boolean } = {}
): StoredPosition {
  const { VW, VH } = designViewport(vp)

  // into design space
  const L = box.left / vp.s
  const T = box.top / vp.s
  const W = box.width / vp.s
  const H = box.height / vp.s

  const anchor = opts.anchor ?? inferAnchor({ left: L, top: T, width: W, height: H }, VW, VH)
  const ax = anchor[1] as AnchorX
  const ay = anchor[0] as AnchorY

  let dx: number
  if (ax === 'L') dx = L
  else if (ax === 'R') dx = VW - (L + W)
  else dx = L + W / 2 - VW / 2

  let dy: number
  if (ay === 'T') dy = T
  else if (ay === 'B') dy = VH - (T + H)
  else dy = T + H / 2 - VH / 2

  return {
    v: 2,
    anchor,
    dx: round2(dx),
    dy: round2(dy),
    w: round2(W),
    h: round2(H),
    ...(opts.bleed ? { bleed: true } : {})
  }
}

/**
 * Record -> screen rect for the live viewport, clamped on-screen.
 * The clamp is applied to the RESULT only, never written back, so a layout
 * authored on a big screen is restored intact when the player returns to it.
 */
export function resolve(rec: StoredPosition, vp: Viewport): Rect {
  const ax = rec.anchor[1] as AnchorX
  const ay = rec.anchor[0] as AnchorY

  const width = rec.w * vp.s
  const height = rec.h * vp.s

  let left: number
  if (ax === 'L') left = rec.dx * vp.s
  else if (ax === 'R') left = vp.w - (rec.dx + rec.w) * vp.s
  else left = vp.w / 2 + rec.dx * vp.s - width / 2

  let top: number
  if (ay === 'T') top = rec.dy * vp.s
  else if (ay === 'B') top = vp.h - (rec.dy + rec.h) * vp.s
  else top = vp.h / 2 + rec.dy * vp.s - height / 2

  const pad = SAFE_PAD * vp.s

  // an element wider/taller than the screen is centred rather than pinned
  const minL = rec.bleed ? -width * 0.9 : pad
  const maxL = vp.w - pad - width
  left = maxL < minL ? (vp.w - width) / 2 : clampNum(left, minL, maxL)

  const maxT = vp.h - pad - height
  top = maxT < pad ? (vp.h - height) / 2 : clampNum(top, pad, maxT)

  return { left, top, width, height }
}

/**
 * Which edge does this element belong to?
 * Edge bands are generous (35%) because HUD elements hug edges; only something
 * genuinely mid-screen gets a centre anchor.
 */
export function inferAnchor(box: Rect, VW: number, VH: number): Anchor {
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2

  const ax: AnchorX = cx < VW * 0.35 ? 'L' : cx > VW * 0.65 ? 'R' : 'C'
  const ay: AnchorY = cy < VH * 0.35 ? 'T' : cy > VH * 0.65 ? 'B' : 'M'

  return `${ay}${ax}` as Anchor
}

const round2 = (n: number) => Math.round(n * 100) / 100

/* ---------------------------------------------------------------------------
   Default layout - authored directly in design space, no window reads.
   These numbers reproduce today's 1920x1080 appearance exactly.
--------------------------------------------------------------------------- */

const TL = (x: number, y: number, w: number, h: number): StoredPosition =>
  ({ v: 2, anchor: 'TL', dx: x, dy: y, w, h })

const TR = (fromRight: number, y: number, w: number, h: number): StoredPosition =>
  ({ v: 2, anchor: 'TR', dx: fromRight, dy: y, w, h })

const BL = (x: number, fromBottom: number, w: number, h: number): StoredPosition =>
  ({ v: 2, anchor: 'BL', dx: x, dy: fromBottom, w, h })

const BR = (fromRight: number, fromBottom: number, w: number, h: number): StoredPosition =>
  ({ v: 2, anchor: 'BR', dx: fromRight, dy: fromBottom, w, h })

/** card stacks on the right, per player-info layout */
const cardStack = (layout: string, fromRight: number, top: number, w: number, step: number) => {
  const ids = ['voiceCard', 'idCard', 'timeCard', 'jobCard', 'bankCard', 'cashCard', 'dirtyCard', 'weaponDisplay']
  const out: Record<string, StoredPosition> = {}
  ids.forEach((id, i) => {
    out[`${id}_${layout}`] = TR(fromRight, top + i * step, w, 40)
  })
  return out
}

export const DEFAULT_LAYOUT: Record<string, StoredPosition> = {
  // bottom-left cluster
  minimap: { ...BL(0, 60, 270, 190), bleed: true },
  location: BL(20, 0, 270, 60),
  statusBars: BL(20, 80, 400, 60),

  // status icons sit in a row above the minimap
  healthIcon: BL(30, 254, 56, 56),
  armorIcon: BL(90, 254, 56, 56),
  hungerIcon: BL(150, 254, 56, 56),
  thirstIcon: BL(210, 254, 56, 56),
  oxygenIcon: BL(270, 254, 56, 56),
  stressIcon: BL(330, 254, 56, 56),

  // vehicle HUD - top-left
  vehicleHud: TL(20, 20, 240, 200),

  // player info
  playerInfoContainer: TL(20, 20, 250, 240),
  weaponDisplay: BR(250, 290, 350, 60),

  // server logo - top centre, stays centred at any aspect
  serverLogo: { v: 2, anchor: 'TC', dx: 0, dy: 20, w: 300, h: 100 },

  ...cardStack('miniature', 200, 20, 200, 42),
  ...cardStack('grid', 200, 20, 200, 65),
  ...cardStack('modern', 220, 20, 220, 75)
}

export const cloneLayout = (src: Record<string, StoredPosition> = DEFAULT_LAYOUT) =>
  JSON.parse(JSON.stringify(src)) as Record<string, StoredPosition>

/* ---------------------------------------------------------------------------
   Reading / writing through the settings blob
--------------------------------------------------------------------------- */

const isStored = (r: any): r is StoredPosition =>
  !!r && r.v === 2 && typeof r.dx === 'number' && typeof r.dy === 'number'

/**
 * Resolve a key to screen pixels. Falls back to the shipped default, then to a
 * safe top-left slot, so a missing/corrupt record can never hide an element.
 */
export function readPosition(
  uiPositions: Record<string, any> | undefined,
  key: string,
  vp: Viewport,
  fallback?: StoredPosition
): Rect {
  const rec = uiPositions?.[key]

  if (isStored(rec)) return resolve(rec, vp)

  // legacy raw-pixel record that escaped migration: treat as design-space px
  if (rec && Number.isFinite(rec.x) && Number.isFinite(rec.y)) {
    const def = fallback ?? DEFAULT_LAYOUT[key]
    const legacy: StoredPosition = {
      v: 2,
      anchor: inferAnchor(
        { left: rec.x, top: rec.y, width: rec.width ?? def?.w ?? 0, height: rec.height ?? def?.h ?? 0 },
        DESIGN_W,
        DESIGN_H
      ),
      dx: 0,
      dy: 0,
      w: rec.width ?? def?.w ?? 0,
      h: rec.height ?? def?.h ?? 0
    }
    // recompute dx/dy from the raw pixels interpreted in design space
    const asBox = { left: rec.x, top: rec.y, width: legacy.w, height: legacy.h }
    return resolve(toStored(asBox, makeViewport(DESIGN_W, DESIGN_H), { anchor: legacy.anchor }), vp)
  }

  const def = fallback ?? DEFAULT_LAYOUT[key]
  return def ? resolve(def, vp) : { left: 20 * vp.s, top: 20 * vp.s, width: 0, height: 0 }
}

/** Build the record to persist after a drag, from the element's live rect. */
export function writePosition(
  el: HTMLElement,
  vp: Viewport,
  key: string
): StoredPosition {
  const r = el.getBoundingClientRect()
  const prev = DEFAULT_LAYOUT[key]
  return toStored(
    { left: r.left, top: r.top, width: r.width, height: r.height },
    vp,
    { bleed: prev?.bleed }
  )
}

/* ---------------------------------------------------------------------------
   Migration from legacy raw-pixel records
--------------------------------------------------------------------------- */

const EDGE_PAD = 20

/**
 * Convert a legacy settings blob in place (pure - returns a new object).
 *
 * The capture resolution was never recorded, so it is inferred ONCE from the
 * whole key set: the capture screen cannot have been smaller than the furthest
 * element's far edge. When the data already fits the current screen we assume
 * it was authored here, which makes the common case an exact identity - a
 * 1080p player's layout does not move by a single pixel.
 */
export function migrateUiPositions<T extends Record<string, any>>(settings: T, vp: Viewport): T {
  if (!settings || typeof settings !== 'object') return settings
  if ((settings as any).__positionSchema === 2) return settings

  const src = (settings as any).uiPositions
  if (!src || typeof src !== 'object') {
    return { ...settings, uiPositions: cloneLayout(), __positionSchema: 2 }
  }

  // ---- infer the capture viewport from the extents of the whole blob ----
  let maxRight = 0
  let maxBottom = 0
  for (const k of Object.keys(src)) {
    const r = src[k]
    if (!r || r.v === 2) continue
    if (Number.isFinite(r.x)) maxRight = Math.max(maxRight, r.x + (r.width || DEFAULT_LAYOUT[k]?.w || 0))
    if (Number.isFinite(r.y)) maxBottom = Math.max(maxBottom, r.y + (r.height || DEFAULT_LAYOUT[k]?.h || 0))
  }

  const fitsHere = maxRight <= vp.w && maxBottom <= vp.h
  const capture = fitsHere
    ? vp
    : makeViewport(Math.max(vp.w, maxRight + EDGE_PAD), Math.max(vp.h, maxBottom + EDGE_PAD))

  const { VW, VH } = designViewport(capture)

  // ---- convert every key ----
  const out: Record<string, StoredPosition> = {}
  for (const key of Object.keys({ ...DEFAULT_LAYOUT, ...src })) {
    const rec = src[key]

    if (isStored(rec)) {
      out[key] = rec
      continue
    }

    if (!rec || !Number.isFinite(rec.x) || !Number.isFinite(rec.y)) {
      if (DEFAULT_LAYOUT[key]) out[key] = DEFAULT_LAYOUT[key]
      continue
    }

    try {
      const def = DEFAULT_LAYOUT[key]
      const w = rec.width ?? def?.w ?? 0
      const h = rec.height ?? def?.h ?? 0
      const designBox = { left: rec.x / capture.s, top: rec.y / capture.s, width: w / capture.s, height: h / capture.s }
      const anchor = def?.anchor ?? inferAnchor(designBox, VW, VH)

      out[key] = toStored(
        { left: rec.x, top: rec.y, width: w, height: h },
        capture,
        { anchor, bleed: def?.bleed }
      )
    } catch {
      if (DEFAULT_LAYOUT[key]) out[key] = DEFAULT_LAYOUT[key]
    }
  }

  return { ...settings, uiPositions: out, __positionSchema: 2 }
}
