const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CALENDAR_STATE: Array<'default' | 'upcoming' | 'risk' | 'overdue'> = [
  'default',
  'default',
  'upcoming',
  'default',
  'risk',
  'default',
  'overdue',
]
const CALENDAR_TONE: Record<string, string> = {
  default: 'bg-white/10 text-white/50',
  upcoming: 'bg-[#47bfff]/25 text-[#8fe0ff]',
  risk: 'bg-amber-400/25 text-amber-200',
  overdue: 'bg-[#ff5c7c]/25 text-[#ffb0c0]',
}
const BARS = [38, 62, 45, 80, 58]

/**
 * A stylized, abstracted glimpse of the product — not a screenshot claim,
 * a small illustrated panel (calendar strip + stat + trend bars) giving
 * the hero real visual weight instead of typography alone. Deliberately
 * schematic rather than a literal UI mockup, so it reads as illustration.
 */
export function HeroVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -top-16 -right-10 size-72 rounded-full bg-[#7e14ff]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -left-10 size-64 rounded-full bg-[#47bfff]/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-white/50">Compliance calendar</p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60">
            Live
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEK.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-white/35">{day}</span>
              <div
                className={`flex size-7 items-center justify-center rounded-md text-[11px] font-semibold ${CALENDAR_TONE[CALENDAR_STATE[i]]}`}
              >
                {12 + i}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-2xl font-bold tabular-nums text-white">3</p>
            <p className="text-xs text-white/50">obligations due this week</p>
          </div>
          <div className="flex items-end gap-1.5 rounded-xl bg-white/5 p-4">
            {BARS.map((height, i) => (
              <div
                key={i}
                className="w-full rounded-sm bg-gradient-to-t from-[#7e14ff] to-[#47bfff]"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
