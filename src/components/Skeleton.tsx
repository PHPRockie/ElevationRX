import type { CSSProperties } from 'react'

const SHIMMER_STYLE: CSSProperties = {
  background: 'linear-gradient(90deg,#1e1a30 0%,#2a2448 50%,#1e1a30 100%)',
  backgroundSize: '600px 100%',
  animation: 'sk-shimmer 1.6s ease-in-out infinite',
}

const KEYFRAMES = `
  @keyframes sk-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
`

function Line({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`rounded-md ${className}`} style={{ ...SHIMMER_STYLE, ...style }} />
}

export function AthleteListSkeleton() {
  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Mobile */}
      <div className="flex flex-col gap-2 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex-1">
              <Line className="mb-2 h-3.5" style={{ width: `${46 + (i % 3) * 12}%` }} />
              <Line className="h-2.5" style={{ width: `${26 + (i % 2) * 10}%` }} />
            </div>
            <Line className="h-5 w-6" />
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <div className="bg-[#1a1728] px-4 py-3">
          <div className="flex gap-20">
            <Line className="h-2.5 w-16" />
            <Line className="h-2.5 w-12" />
            <Line className="h-2.5 w-20" />
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-20 border-t border-border px-4 py-3">
            <Line className="h-3" style={{ width: 100 + (i % 3) * 40 }} />
            <Line className="h-3 w-16" />
            <Line className="h-3 w-24" />
          </div>
        ))}
      </div>
    </>
  )
}

export function AthleteDetailSkeleton() {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className="p-4 md:p-6">
        <Line className="mb-6 h-3 w-16" />

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Line className="mb-2 h-5 w-44" />
            <Line className="h-3 w-64" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Line className="h-8 w-14 rounded-md" />
            <Line className="h-8 w-14 rounded-md" />
            <Line className="h-8 w-28 rounded-md" />
            <Line className="h-8 w-28 rounded-md" />
          </div>
        </div>

        <Line className="mb-3 h-3 w-40" />
        <div className="mb-6 overflow-hidden rounded-lg border border-border bg-card">
          {[55, 70, 45].map((w, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <Line className="h-3" style={{ width: `${w}%` }} />
              <Line className="h-3 w-12" />
              <Line className="h-3 w-8" />
            </div>
          ))}
        </div>

        <Line className="mb-3 h-3 w-48" />
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {[60, 50].map((w, i) => (
            <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <Line className="h-3" style={{ width: `${w}%` }} />
              <Line className="h-3 w-10" />
              <Line className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
