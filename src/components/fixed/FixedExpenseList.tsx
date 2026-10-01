import type { Category, FixedExpense } from '../../types'
import { fixedFrequencyLabels, weekDayLabels } from '../../data/defaults'
import { currency } from '../../utils/money'

type FixedExpenseListProps = {
  items: FixedExpense[]
  categoryLookup: Map<string, Category>
  onEdit: (fixedExpense: FixedExpense) => void
  onDelete: (id: string) => void
}

export function FixedExpenseList({ items, categoryLookup, onEdit, onDelete }: FixedExpenseListProps) {
  return (
    <div className="list">
      {items.length === 0 ? <p className="empty-state">Chưa có khoản chi cố định.</p> : null}
      {items.map((item) => {
        const category = categoryLookup.get(item.category_id)
        return (
          <article className="list-row" key={item.id}>
            <div className="row-main">
              <span className="category-chip" style={{ backgroundColor: category?.color ?? '#e2e8f0' }}>{category?.icon ?? '•'}</span>
              <div><strong>{item.name}</strong><p>{fixedFrequencyLabels[item.frequency]} · {item.frequency === 'monthly' ? `Ngày ${item.day_of_month}` : weekDayLabels[item.day_of_week ?? 1]} · {item.is_active ? 'Đang áp dụng' : 'Tạm dừng'}</p></div>
            </div>
            <div className="row-actions"><strong>{currency(item.amount)}</strong><button className="ghost-button" onClick={() => onEdit(item)} type="button">Sửa</button><button className="danger-button" onClick={() => onDelete(item.id)} type="button">Xóa</button></div>
          </article>
        )
      })}
    </div>
  )
}
