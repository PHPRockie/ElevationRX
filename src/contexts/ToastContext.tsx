import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type Variant = 'success' | 'error' | 'info'

interface ToastMsg { id: number; text: string; variant: Variant }

interface ToastAPI {
  success: (text: string) => void
  error:   (text: string) => void
  info:    (text: string) => void
}

const Ctx = createContext<ToastAPI | null>(null)

const PALETTE: Record<Variant, { fg: string; ring: string }> = {
  success: { fg: '#34d399', ring: 'rgba(52,211,153,.28)' },
  error:   { fg: '#f87171', ring: 'rgba(248,113,113,.28)' },
  info:    { fg: '#a78bfa', ring: 'rgba(167,139,250,.28)' },
}

const ICONS: Record<Variant, string> = { success: '✓', error: '✕', info: 'i' }

const TOAST_TTL = 3500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems(p => p.filter(t => t.id !== id))
  }, [])

  const add = useCallback((text: string, variant: Variant) => {
    const id = ++seq.current
    setItems(p => [...p, { id, text, variant }])
    setTimeout(() => dismiss(id), TOAST_TTL)
  }, [dismiss])

  const api: ToastAPI = {
    success: t => add(t, 'success'),
    error:   t => add(t, 'error'),
    info:    t => add(t, 'info'),
  }

  return (
    <Ctx.Provider value={api}>
      {children}
      <style>{`
        @keyframes toast-rise {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 20,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column-reverse', gap: 8,
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 40px)',
      }}>
        {items.map(t => {
          const { fg, ring } = PALETTE[t.variant]
          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: '#181530',
                border: `1px solid ${ring}`,
                borderRadius: 11,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,.5)',
                minWidth: 220,
                maxWidth: 320,
                animation: 'toast-rise .28s cubic-bezier(.22,1,.36,1)',
                fontFamily: 'inherit',
                fontSize: 13,
                color: '#edeaff',
                lineHeight: 1.45,
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: `${fg}18`,
                border: `1px solid ${ring}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: fg, fontSize: 11, fontWeight: 800,
                flexShrink: 0,
              }}>
                {ICONS[t.variant]}
              </span>
              <span style={{ flex: 1 }}>{t.text}</span>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'none', border: 'none',
                  color: '#3e3a60', cursor: 'pointer',
                  padding: '2px 4px', fontSize: 14,
                  lineHeight: 1, fontFamily: 'inherit', flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastAPI {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
