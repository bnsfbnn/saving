import type { Category, FixedExpenseDraft, FixedFrequency } from '../../types'
import { weekDayLabels } from '../../data/defaults'

type FixedExpenseFormProps = {
  draft: FixedExpenseDraft
  editingId: string
  fixedCategories: Category[]
  onDraftChange: (updater: (current: FixedExpenseDraft) => FixedExpenseDraft) => void
  onSave: () => void
  onCancelEdit: () => void
}

export function FixedExpenseForm({ draft, editingId, fixedCategories, onDraftChange, onSave, onCancelEdit }: FixedExpenseFormProps) {
  return (
    <div className="panel form-panel fixed-form-panel">
      <div className="section-head">
        <h2>{editingId ? 'Sửa chi cố định' : 'Thêm chi cố định'}</h2>
        {editingId ? <button className="ghost-button" onClick={onCancelEdit} type="button">Hủy sửa</button> : null}
      </div>
      <div className="form-grid two-cols">
        <label>Tên khoản chi<input value={draft.name} onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Category<select value={draft.category_id} onChange={(event) => onDraftChange((current) => ({ ...current, category_id: event.target.value }))}>
          <option value="">Chọn category</option>
          {fixedCategories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
        </select></label>
        <label>Số tiền<input inputMode="decimal" value={draft.amount} onChange={(event) => onDraftChange((current) => ({ ...current, amount: event.target.value }))} /></label>
        <label>Tần suất<select value={draft.frequency} onChange={(event) => onDraftChange((current) => ({ ...current, frequency: event.target.value as FixedFrequency }))}>
          <option value="monthly">Hàng tháng</option><option value="weekly">Hàng tuần</option>
        </select></label>
        {draft.frequency === 'monthly' ? (
          <label>Ngày trong tháng<input inputMode="numeric" min="1" max="31" value={draft.day_of_month} onChange={(event) => onDraftChange((current) => ({ ...current, day_of_month: event.target.value }))} /></label>
        ) : (
          <label>Thứ trong tuần<select value={draft.day_of_week} onChange={(event) => onDraftChange((current) => ({ ...current, day_of_week: event.target.value }))}>
            {weekDayLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
          </select></label>
        )}
        <label>Bắt đầu từ<input type="date" value={draft.start_date} onChange={(event) => onDraftChange((current) => ({ ...current, start_date: event.target.value }))} /></label>
        <label className="wide-field">Ghi chú<input value={draft.note} onChange={(event) => onDraftChange((current) => ({ ...current, note: event.target.value }))} /></label>
        <label className="check-row"><input type="checkbox" checked={draft.is_active} onChange={(event) => onDraftChange((current) => ({ ...current, is_active: event.target.checked }))} />Đang áp dụng</label>
      </div>
      <div className="form-actions"><button onClick={onSave} type="button">{editingId ? 'Cập nhật' : 'Lưu khoản chi'}</button></div>
    </div>
  )
}
