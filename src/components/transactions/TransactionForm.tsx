import type { Category, TransactionDraft, TransactionType } from '../../types'

type TransactionFormProps = {
  title: string
  lockedType?: TransactionType
  draft: TransactionDraft
  editingId: string
  incomeCategories: Category[]
  expenseCategories: Category[]
  onDraftChange: (updater: (current: TransactionDraft) => TransactionDraft) => void
  onSave: (typeOverride?: TransactionType) => void
  onCancelEdit: () => void
}

export function TransactionForm({
  title,
  lockedType,
  draft,
  editingId,
  incomeCategories,
  expenseCategories,
  onDraftChange,
  onSave,
  onCancelEdit,
}: TransactionFormProps) {
  const type = lockedType ?? draft.type
  const options = type === 'income' ? incomeCategories : expenseCategories

  return (
    <section className="panel form-panel">
      <div className="section-head">
        <h2>{editingId ? `Sửa ${title.toLowerCase()}` : title}</h2>
        {editingId ? (
          <button className="ghost-button" onClick={onCancelEdit} type="button">
            Hủy sửa
          </button>
        ) : null}
      </div>
      <div className="form-grid two-cols">
        {!lockedType ? (
          <label>
            Loại giao dịch
            <select
              value={draft.type}
              onChange={(event) => onDraftChange((current) => ({ ...current, type: event.target.value as TransactionType, category_id: '' }))}
            >
              <option value="income">Thu</option>
              <option value="expense">Chi</option>
            </select>
          </label>
        ) : null}
        <label>
          Category
          <select value={draft.category_id} onChange={(event) => onDraftChange((current) => ({ ...current, category_id: event.target.value }))}>
            <option value="">Chọn category</option>
            {options.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
          </select>
        </label>
        <label>
          Số tiền
          <input inputMode="decimal" value={draft.amount} onChange={(event) => onDraftChange((current) => ({ ...current, amount: event.target.value }))} placeholder="Ví dụ: 250000" />
        </label>
        <label>
          Ngày
          <input type="date" value={draft.occurred_on} onChange={(event) => onDraftChange((current) => ({ ...current, occurred_on: event.target.value }))} />
        </label>
        <label className="wide-field">
          Ghi chú
          <input value={draft.note} onChange={(event) => onDraftChange((current) => ({ ...current, note: event.target.value }))} placeholder="Nội dung giao dịch" />
        </label>
      </div>
      <div className="form-actions">
        <button onClick={() => onSave(lockedType)} type="button">{editingId ? 'Cập nhật' : 'Lưu giao dịch'}</button>
      </div>
    </section>
  )
}
