import { forwardRef } from 'react'

const BarcodeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M3 5h2v14H3V5zm4 0h1v14H7V5zm3 0h2v14h-2V5zm4 0h1v14h-1V5zm3 0h2v14h-2V5zm4 0h2v14h-2V5z" fill="currentColor" opacity="0.9" />
  </svg>
)

const KeyboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 10h2M10 10h2M14 10h2M18 10h2M6 14h4M12 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/**
 * Full-width dominant search for POS — barcode wedge types into the field; Enter submits.
 */
export const SearchBar = forwardRef(function SearchBar({
  value,
  onChange,
  onEnter,
  onFocusSearch,
  placeholder = 'Scan barcode or search product (Name / SKU)',
  disabled = false,
  t,
}, ref) {
  return (
    <div
      className="pos-search-bar-wrap"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        borderRadius: 14,
        background: t.input,
        boxShadow: `0 8px 28px rgba(15, 23, 42, 0.07), 0 0 0 1px ${t.border}`,
        overflow: 'hidden',
        minHeight: 58,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 5,
          flexShrink: 0,
          background: t.blue,
          alignSelf: 'stretch',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 10px 0 12px',
          color: t.text3,
          flexShrink: 0,
        }}
      >
        <BarcodeIcon />
      </div>
      <input
        ref={ref}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter?.()
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          background: 'transparent',
          color: t.text,
          fontSize: 17,
          fontWeight: 600,
          outline: 'none',
          padding: '16px 10px 16px 0',
          lineHeight: 1.2,
        }}
      />
      <button
        type="button"
        onClick={() => onFocusSearch?.()}
        title="Focus search (F2)"
        className="pos-search-f2-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '0 16px',
          minWidth: 52,
          border: 'none',
          borderLeft: `1px solid ${t.border}`,
          background: t.bg3,
          color: t.text2,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <KeyboardIcon />
        <span style={{ fontSize: 12, fontWeight: 800, color: t.text4, letterSpacing: 0.02 }}>F2</span>
      </button>
    </div>
  )
})
