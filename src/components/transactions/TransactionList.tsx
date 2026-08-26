import type { Category, Transaction } from '../../types'
import { currency } from '../../utils/money'

type TransactionListProps = {
  items: Transaction[]
  categoryLookup: Map<string, Category>
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionList({ items, categoryLookup, onEdit, onDelete }: TransactionListProps) {
  return (
    <div className="list">
      {items.length === 0 ? <p className="empty-state">Chưa có giao dịch.</p> : null}
      {items.map((transaction) => {
        const category = categoryLookup.get(transaction.category_id)
        return (
          <article className="list-row" key={transaction.id}>
            <div className="row-main">
              <span className="category-chip" style={{ backgroundColor: category?.color ?? '#e2e8f0' }}>{category?.icon ?? '•'}</span>
              <div>
                <strong>{category?.name ?? 'Không rõ category'}</strong>
                <p>{transaction.occurred_on}{transaction.note ? ` · ${transaction.note}` : ''}</p>
              </div>
            </div>
            <div className="row-actions">
              <strong className={transaction.type === 'income' ? 'money-positive' : 'money-negative'}>{transaction.type === 'income' ? '+' : '-'}{currency(transaction.amount)}</strong>
              <button className="ghost-button" onClick={() => onEdit(transaction)} type="button">Sửa</button>
              <button className="danger-button" onClick={() => onDelete(transaction.id)} type="button">Xóa</button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
