import type { Category } from '../../types'
import type { FixedOccurrence } from '../../utils/finance'
import { currency } from '../../utils/money'

type FixedMonthPanelProps = {
  occurrences: FixedOccurrence[]
  fixedExpenseTotal: number
  categoryLookup: Map<string, Category>
}

export function FixedMonthPanel({ occurrences, fixedExpenseTotal, categoryLookup }: FixedMonthPanelProps) {
  return (
    <div className="panel">
      <div className="section-head">
        <h2>🔄 Chi cố định tháng</h2>
        <strong>{currency(fixedExpenseTotal)}</strong>
      </div>
      <div className="compact-list">
        {occurrences.length === 0 ? <p className="empty-state">Chưa có lịch chi cố định.</p> : null}
        {occurrences.slice(0, 8).map((occurrence) => {
          const category = categoryLookup.get(occurrence.category_id)
          return (
            <div className="compact-row" key={`${occurrence.fixedExpense.id}-${occurrence.date}`}>
              <span>{occurrence.date}</span>
              <strong>{category?.name ?? occurrence.fixedExpense.name}</strong>
              <em>{currency(occurrence.amount)}</em>
            </div>
          )
        })}
      </div>
    </div>
  )
}
