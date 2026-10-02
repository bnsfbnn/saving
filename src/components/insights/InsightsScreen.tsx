import type { FinanceData } from '../../hooks/useFinanceData'
import { currency } from '../../utils/money'
import { monthLabel } from '../../utils/dates'

type Props = { data: FinanceData }

export function InsightsScreen({ data }: Props) {
  const { spendingInsights, selectedMonth } = data
  return (
    <section className="insights-grid">
      <div className="panel insight-hero">
        <div className="section-head"><div><h2>Phân tích thói quen chi tiêu</h2><p>{monthLabel(selectedMonth)} · so sánh với tháng trước</p></div><span className="insight-score">{spendingInsights.score}/100</span></div>
        <p className="insight-summary">{spendingInsights.summary}</p>
      </div>
      <div className="panel">
        <div className="section-head"><h2>Danh mục tăng bất thường</h2><span>Ưu tiên xem</span></div>
        <div className="insight-list">{spendingInsights.rising.length ? spendingInsights.rising.map((item) => <div className="insight-row" key={item.category.id}><span className="category-chip" style={{ backgroundColor: item.category.color }}>{item.category.icon}</span><div><strong>{item.category.name}</strong><small>{currency(item.current)} tháng này</small></div><b className="trend-up">+{item.change}%</b></div>) : <p className="empty-state">Chưa đủ dữ liệu để nhận diện xu hướng.</p>}</div>
      </div>
      <div className="panel">
        <div className="section-head"><h2>Khoản chi lớn</h2><span>Top 5</span></div>
        <div className="insight-list">{spendingInsights.largest.map((item) => <div className="insight-row" key={item.id}><div><strong>{item.note || item.category.name}</strong><small>{item.category.name} · {item.occurred_on}</small></div><b>{currency(item.amount)}</b></div>)}</div>
      </div>
      <div className="panel insight-tips"><div className="section-head"><h2>Gợi ý cắt giảm</h2><span>Thực tế, dễ làm</span></div><ul>{spendingInsights.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul></div>
    </section>
  )
}

export type InsightItem = { category: { id: string; name: string; color: string; icon: string }; current: number; change: number }
export type SpendingInsights = { score: number; summary: string; rising: InsightItem[]; largest: Array<{ id: string; note: string; category: { name: string }; occurred_on: string; amount: number }>; tips: string[] }
