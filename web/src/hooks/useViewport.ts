import { useSyncExternalStore } from 'react'
import { makeViewport, readViewport, Viewport } from '../utils/layout'

/* ============================================================================
   useViewport
   ----------------------------------------------------------------------------
   Nothing in the HUD re-rendered when the game resolution changed - there was
   not a single resize listener outside the dropdown. Every element kept the
   pixel geometry of whatever viewport existed when it first mounted.

   One module-level subscription feeds every consumer via useSyncExternalStore,
   so ~30 HUD elements share a single listener instead of registering their own.
   The snapshot is cached and only replaced when the dimensions actually change,
   which keeps the reference stable and lets memo() on the cards keep working.

   A ResizeObserver on documentElement backs up the resize event: CEF can
   resize its surface without always emitting `resize`.
   ========================================================================= */

let snapshot: Viewport = readViewport()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach(l => l())

const refresh = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w === snapshot.w && h === snapshot.h) return

  snapshot = makeViewport(w, h)

  // expose the scale to CSS so sizing can track the same factor as positioning
  const root = document.documentElement
  root.style.setProperty('--hud-s', String(snapshot.s))
  root.style.setProperty('--hud-vw', `${w}px`)
  root.style.setProperty('--hud-vh', `${h}px`)

  emit()
}

let started = false
let frame = 0

const schedule = () => {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    refresh()
  })
}

const start = () => {
  if (started || typeof window === 'undefined') return
  started = true

  // publish the initial scale immediately
  const root = document.documentElement
  root.style.setProperty('--hud-s', String(snapshot.s))
  root.style.setProperty('--hud-vw', `${snapshot.w}px`)
  root.style.setProperty('--hud-vh', `${snapshot.h}px`)

  window.addEventListener('resize', schedule)
  try {
    new ResizeObserver(schedule).observe(document.documentElement)
  } catch {
    /* ResizeObserver unavailable - the resize event alone will do */
  }
}

const subscribe = (cb: () => void) => {
  start()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

const getSnapshot = () => snapshot

/** Live viewport + the uniform design-space scale. Re-renders on resolution change. */
export const useViewport = (): Viewport =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
