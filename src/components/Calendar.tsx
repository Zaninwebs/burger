import { useMemo } from 'react'
import { DAY_STATUS_LABEL, parseIsoDate, type PublicDay } from '../../shared/booking'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

interface Props {
  month: string
  days: PublicDay[] | null
  loading: boolean
  selected: string | null
  onSelect: (date: string) => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
  allowAll?: boolean
}

export const monthLabel = (month: string) =>
  parseIsoDate(`${month}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const longDate = (iso: string) =>
  parseIsoDate(iso).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

/** Monatskalender mit Verfügbarkeitsstatus pro Tag. */
export function Calendar({ month, days, loading, selected, onSelect, onPrev, onNext, canPrev, canNext, allowAll }: Props) {
  const offset = useMemo(() => (parseIsoDate(`${month}-01`).getUTCDay() + 6) % 7, [month])

  return (
    <div className="cal" aria-busy={loading}>
      <div className="cal__head">
        <button type="button" className="cal__nav" onClick={onPrev} disabled={!canPrev} aria-label="Vorheriger Monat">
          ←
        </button>
        <h3 className="cal__month" aria-live="polite">
          {monthLabel(month)}
        </h3>
        <button type="button" className="cal__nav" onClick={onNext} disabled={!canNext} aria-label="Nächster Monat">
          →
        </button>
      </div>

      <div className="cal__grid" role="grid" aria-label={`Verfügbarkeit ${monthLabel(month)}`}>
        <div className="cal__row cal__weekdays" role="row">
          {WEEKDAYS.map((d) => (
            <span key={d} role="columnheader" className="cal__wd">
              {d}
            </span>
          ))}
        </div>
        <div className="cal__days" role="row">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`e${i}`} className="cal__empty" role="presentation" />
          ))}
          {(days ?? Array.from({ length: 30 }, () => null)).map((d, i) => {
            if (!d)
              return (
                <span key={i} className="cal__day is-skeleton" role="gridcell">
                  <span />
                </span>
              )
            const bookable = allowAll || d.status === 'available' || d.status === 'partial'
            const label = `${longDate(d.date)}: ${DAY_STATUS_LABEL[d.status]}${d.label ? ` (${d.label})` : ''}`
            return (
              <button
                key={d.date}
                type="button"
                role="gridcell"
                className={`cal__day is-${d.status} ${selected === d.date ? 'is-selected' : ''}`}
                disabled={!bookable}
                aria-selected={selected === d.date}
                aria-label={label}
                title={d.label ?? DAY_STATUS_LABEL[d.status]}
                onClick={() => onSelect(d.date)}
              >
                <span className="cal__num">{Number(d.date.slice(8))}</span>
                <i className="cal__dot" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      <ul className="cal__legend" aria-label="Legende">
        <li>
          <i className="is-available" /> Verfügbar
        </li>
        <li>
          <i className="is-partial" /> Teilweise verfügbar
        </li>
        <li>
          <i className="is-full" /> Ausgebucht
        </li>
        <li>
          <i className="is-closed" /> Geschlossen
        </li>
      </ul>
    </div>
  )
}
