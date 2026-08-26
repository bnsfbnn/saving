import type { MonthlyBudget } from '../../types'
import { currency } from '../../utils/money'
import { monthLabel } from '../../utils/dates'

type BudgetHistoryTableProps = {
  budgets: MonthlyBudget[]
}

export function BudgetHistoryTable({ budgets }: BudgetHistoryTableProps) {
  if (budgets.length === 0) return null

  return (
    <section className="panel wide-panel">
      <h2>📅 Các tháng đã lưu</h2>
      <div className="table-wrap"><table><thead><tr><th>Tháng</th><th>Số tiền đầu tháng</th><th>Ghi chú</th></tr></thead><tbody>
        {budgets.map((budget) => (
          <tr key={budget.id}><td>{monthLabel(budget.month_start)}</td><td>{currency(budget.starting_amount)}</td><td>{budget.note}</td></tr>
        ))}
      </tbody></table></div>
    </section>
  )
}
