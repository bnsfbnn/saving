import type { CategoryDraft, CategoryKind } from '../../types'
import { categoryKindLabels, colorOptions, iconOptions } from '../../data/defaults'

type CategoryFormProps = {
  draft: CategoryDraft
  editingId: string
  onDraftChange: (updater: (current: CategoryDraft) => CategoryDraft) => void
  onSave: () => void
  onSeedDefaults: () => void
  onCancelEdit: () => void
}

export function CategoryForm({ draft, editingId, onDraftChange, onSave, onSeedDefaults, onCancelEdit }: CategoryFormProps) {
  return (
    <div className="panel form-panel category-form-panel">
      <div className="section-head"><h2>{editingId ? 'Sửa category' : 'Thêm category'}</h2>{editingId ? <button className="ghost-button" onClick={onCancelEdit} type="button">Hủy sửa</button> : null}</div>
      <div className="form-grid two-cols">
        <label>Tên category<input value={draft.name} onChange={(event) => onDraftChange((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Nhóm<select value={draft.kind} onChange={(event) => onDraftChange((current) => ({ ...current, kind: event.target.value as CategoryKind }))}>{Object.entries(categoryKindLabels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
        <label>Màu<select value={draft.color} onChange={(event) => onDraftChange((current) => ({ ...current, color: event.target.value }))}>{colorOptions.map((color) => <option key={color.hex} value={color.hex}>{color.name}</option>)}</select></label>
        <label>Icon<select value={draft.icon} onChange={(event) => onDraftChange((current) => ({ ...current, icon: event.target.value }))}>{iconOptions.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
      </div>
      <div className="category-preview"><span className="category-chip large" style={{ backgroundColor: draft.color }}>{draft.icon}</span><strong>{draft.name || 'Tên category'}</strong><em>{categoryKindLabels[draft.kind]}</em></div>
      <div className="form-actions"><button onClick={onSave} type="button">{editingId ? 'Cập nhật' : 'Thêm category'}</button><button className="ghost-button" onClick={onSeedDefaults} type="button">Nạp mặc định</button></div>
    </div>
  )
}
