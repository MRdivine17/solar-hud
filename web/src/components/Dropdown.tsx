import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './Dropdown.css'

/* ============================================================================
   SOLAR HUD - CUSTOM DROPDOWN
   ----------------------------------------------------------------------------
   Replaces the native <select>, which CEF renders with an unstyleable OS popup
   that ignores the panel's design entirely.

   The menu is rendered through a portal on document.body with fixed
   positioning, because .edit-content-full is `overflow-y: auto` - an absolutely
   positioned menu would be clipped by it and would scroll away from its
   trigger. It flips above the trigger when there is no room below.
   ========================================================================= */

export interface DropdownOption {
  value: string
  label: string
  /** optional muted text shown on the right of the row */
  hint?: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** matches the label above other controls */
  id?: string
}

const MENU_MAX_HEIGHT = 260

const Dropdown = ({ value, options, onChange, placeholder = 'Select…', disabled, id }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [rect, setRect] = useState<{ left: number; top: number; width: number; flip: boolean } | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const typeahead = useRef({ term: '', at: 0 })

  const selectedIndex = options.findIndex(o => o.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

  /** measure the trigger and decide whether the menu opens down or up */
  const measure = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const needed = Math.min(MENU_MAX_HEIGHT, options.length * 34 + 10)
    const flip = spaceBelow < needed + 12 && r.top > spaceBelow

    setRect({
      left: r.left,
      top: flip ? r.top : r.bottom,
      width: r.width,
      flip
    })
  }, [options.length])

  const openMenu = () => {
    if (disabled) return
    measure()
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  const closeMenu = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const commit = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    closeMenu()
    triggerRef.current?.focus()
  }

  // reposition while open; close on any scroll of an ancestor container
  useEffect(() => {
    if (!open) return

    const onScroll = (e: Event) => {
      // scrolling inside the menu itself must not close it
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      measure()
    }
    const onResize = () => measure()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, measure])

  // click outside
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      closeMenu()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, closeMenu])

  // keep the highlighted row in view
  useEffect(() => {
    if (!open || activeIndex < 0) return
    const row = menuRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    // ESC must not bubble - the edit menu closes on Escape
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      e.stopPropagation()
      closeMenu()
      return
    }

    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        openMenu()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(i => (i + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(i => (i - 1 + options.length) % options.length)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      case 'Tab':
        closeMenu()
        break
      default:
        // type-ahead
        if (e.key.length === 1) {
          const now = Date.now()
          const term = now - typeahead.current.at < 700 ? typeahead.current.term + e.key : e.key
          typeahead.current = { term, at: now }
          const hit = options.findIndex(o => o.label.toLowerCase().startsWith(term.toLowerCase()))
          if (hit >= 0) setActiveIndex(hit)
        }
    }
  }

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`sh-dd-trigger ${open ? 'open' : ''}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`sh-dd-value ${selected ? '' : 'placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="sh-dd-chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 L6 8 L9.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && rect && createPortal(
        <div
          ref={menuRef}
          className={`sh-dd-menu ${rect.flip ? 'flip' : ''}`}
          role="listbox"
          style={{
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            ...(rect.flip
              ? { bottom: `${window.innerHeight - rect.top + 6}px` }
              : { top: `${rect.top + 6}px` }),
            maxHeight: `${MENU_MAX_HEIGHT}px`
          }}
          onKeyDown={onKeyDown}
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              data-index={i}
              role="option"
              aria-selected={option.value === value}
              className={`sh-dd-option ${i === activeIndex ? 'active' : ''} ${option.value === value ? 'selected' : ''}`}
              onPointerEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
            >
              <span className="sh-dd-option-label">{option.label}</span>
              {option.hint && <span className="sh-dd-option-hint">{option.hint}</span>}
              <svg className="sh-dd-check" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 6.2 L4.8 8.5 L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

export default Dropdown
