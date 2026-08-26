import type { MonthlySummary } from '../../utils/finance'
import { currency } from '../../utils/money'

type MonthlyMetricsProps = {
  summary: MonthlySummary
}

export function MonthlyMetrics({ summary }: MonthlyMetricsProps) {
  const netIncome = summary.income - summary.variableExpense - summary.fixedExpense

  return (
    <section className="metrics-grid">
      <article className="metric-card income">
        <span>Thu trong tháng</span>
        <strong className="money-positive">{currency(summary.income)}</strong>
      </article>
      <article className="metric-card expense">
        <span>Chi thường trong tháng</span>
        <strong className="money-negative">-{currency(summary.variableExpense)}</strong>
      </article>
      <article className="metric-card expense">
        <span>Chi cố định trong tháng</span>
        <strong className="money-negative">-{currency(summary.fixedExpense)}</strong>
      </article>
      <article className="metric-card expense">
        <span>Chi trong tháng</span>
        <strong className="money-negative">-{currency(summary.totalExpense)}</strong>
      </article>
      <article className="metric-card remaining">
        <span>Thu nhập ròng trong tháng</span>
        <strong className={netIncome >= 0 ? 'money-positive' : 'money-negative'}>
          {currency(netIncome)}
        </strong>
      </article>
      <article className="metric-card remaining">
        <span>Tổng tiết kiệm cuối tháng</span>
        <strong className={summary.remaining >= 0 ? 'money-positive' : 'money-negative'}>{currency(summary.remaining)}</strong>
      </article>
    </section>
  )
}
