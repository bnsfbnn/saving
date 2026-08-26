import type { CSSProperties } from 'react'
import type { CategoryBreakdown } from '../../utils/finance'
import { currency } from '../../utils/money'
import { monthLabel } from '../../utils/dates'

type CategoryBreakdownChartProps = {
  breakdown: CategoryBreakdown[]
  totalExpense: number
  selectedMonth: string
}

export function CategoryBreakdownChart({ breakdown, totalExpense, selectedMonth }: CategoryBreakdownChartProps) {
  return (
    <div className="panel">
      <div className="section-head">
        <h2>📊 Tỷ trọng chi theo category</h2>
        <span>{monthLabel(selectedMonth)}</span>
      </div>
      {breakdown.length === 0 ? (
        <p className="empty-state">Chưa có khoản chi trong tháng.</p>
      ) : (
        <div className="breakdown-chart-layout">
          <div
            className="donut-chart"
            style={{
              background: `conic-gradient(${buildSegments(breakdown, totalExpense).map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(', ')})`,
            }}
            aria-label={`Tỷ trọng chi tháng ${monthLabel(selectedMonth)}`}
            role="img"
          >
            <div className="donut-center">
              <span>Tổng chi</span>
              <strong>{currency(totalExpense)}</strong>
            </div>
            {buildSegments(breakdown, totalExpense).map((segment, index) => {
              const item = breakdown[index]
              const middle = segment.end - (item.total / totalExpense) * 50
              return (
                <span
                  className="donut-label"
                  key={item.category.id}
                  style={{ '--label-angle': `${middle * 3.6}deg` } as CSSProperties}
                  title={`${item.category.name}: ${item.percent}%`}
                >
                  <span className="category-chip" style={{ backgroundColor: item.category.color }}>{item.category.icon}</span>
                  <strong>{item.percent}%</strong>
                  <small>{item.category.name}</small>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

type Segment = { color: string; start: number; end: number }

function buildSegments(breakdown: CategoryBreakdown[], totalExpense: number): Segment[] {
  return breakdown.reduce<Segment[]>((segments, item) => {
    const start = segments.length ? segments[segments.length - 1].end : 0
    const end = start + (item.total / totalExpense) * 100
    segments.push({ color: item.category.color, start, end })
    return segments
  }, [])
}
