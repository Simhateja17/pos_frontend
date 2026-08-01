'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { INDIAN_STATE_OPTIONS, type IndiaStateOption } from '@/lib/india-states'
import styles from './india-auth.module.css'

type IndiaStateComboboxProps = {
  id: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

const GROUPS = [
  { category: 'state' as const, label: 'States' },
  { category: 'union-territory' as const, label: 'Union Territories' },
]

function optionId(id: string, index: number) {
  return `${id}-option-${index}`
}

export function IndiaStateCombobox({ id, value, onChange, required = false }: IndiaStateComboboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listboxId = `${id}-options`

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return INDIAN_STATE_OPTIONS

    return INDIAN_STATE_OPTIONS.filter((option) => option.name.toLocaleLowerCase().includes(normalizedQuery))
  }, [query])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  const openMenu = useCallback(() => {
    setQuery('')
    setActiveIndex(0)
    setIsOpen(true)
  }, [])

  const selectOption = useCallback((option: IndiaStateOption) => {
    onChange(option.name)
    closeMenu()
  }, [closeMenu, onChange])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: globalThis.PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) closeMenu()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closeMenu, isOpen])

  function handleInputChange(nextQuery: string) {
    setQuery(nextQuery)
    setActiveIndex(0)
    setIsOpen(true)
    if (nextQuery !== value) onChange('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
        return
      }
      setActiveIndex((current) => Math.min(current + 1, Math.max(filteredOptions.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        openMenu()
        return
      }
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      if (isOpen && filteredOptions[activeIndex]) {
        event.preventDefault()
        selectOption(filteredOptions[activeIndex])
      } else if (!isOpen) {
        event.preventDefault()
        openMenu()
      }
    } else if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault()
        closeMenu()
      }
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  let optionIndex = 0

  return (
    <div className={styles.combobox} ref={wrapperRef}>
      <Search className={styles.comboboxSearch} aria-hidden="true" />
      <input
        id={id}
        className={`${styles.input} ${styles.comboboxInput}`}
        role="combobox"
        type="text"
        value={isOpen ? query : value}
        placeholder={isOpen ? 'Search states and Union Territories' : 'Select a state or Union Territory'}
        autoComplete="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-activedescendant={isOpen && filteredOptions[activeIndex] ? optionId(id, activeIndex) : undefined}
        aria-required={required}
        required={required && !isOpen}
        onFocus={() => {
          if (!isOpen) openMenu()
        }}
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (!wrapperRef.current?.contains(document.activeElement)) closeMenu()
          })
        }}
      />
      <ChevronDown
        className={`${styles.comboboxChevron} ${isOpen ? styles.comboboxChevronOpen : ''}`}
        aria-hidden="true"
      />
      {isOpen && (
        <div className={styles.comboboxMenu} id={listboxId} role="listbox" aria-label="Indian states and Union Territories">
          {GROUPS.map((group) => {
            const groupOptions = filteredOptions.filter((option) => option.category === group.category)
            if (groupOptions.length === 0) return null

            return (
              <div className={styles.comboboxGroup} key={group.category} role="group" aria-label={group.label}>
                <div className={styles.comboboxGroupLabel}>{group.label}</div>
                {groupOptions.map((option) => {
                  const currentIndex = optionIndex
                  optionIndex += 1
                  const selected = option.name === value

                  return (
                    <button
                      className={`${styles.comboboxOption} ${currentIndex === activeIndex ? styles.comboboxOptionActive : ''} ${selected ? styles.comboboxOptionSelected : ''}`}
                      id={optionId(id, currentIndex)}
                      key={option.name}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(currentIndex)}
                      onClick={() => selectOption(option)}
                    >
                      <span>{option.name}</span>
                      {selected && <Check className={styles.comboboxOptionCheck} aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )
          })}
          {filteredOptions.length === 0 && <div className={styles.comboboxEmpty}>No matching state or Union Territory.</div>}
        </div>
      )}
    </div>
  )
}
