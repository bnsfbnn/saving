import type { Category } from '../../types'
import { categoryKindLabels } from '../../data/defaults'

type CategoryTableProps = {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
}

export function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
  return (
    <div className="table-wrap"><table><thead><tr><th>Nhóm</th><th>Tên</th><th>Màu</th><th>Mặc định</th><th>Thao tác</th></tr></thead><tbody>
      {categories.map((category) => (
        <tr key={category.id}>
          <td>{categoryKindLabels[category.kind]}</td>
          <td><span className="table-category"><span className="category-chip" style={{ backgroundColor: category.color }}>{category.icon}</span>{category.name}</span></td>
          <td>{category.color}</td><td>{category.is_default ? 'Có' : 'Không'}</td>
          <td><div className="table-actions"><button className="ghost-button" onClick={() => onEdit(category)} type="button">Sửa</button><button className="danger-button" onClick={() => onDelete(category.id)} type="button">Xóa</button></div></td>
        </tr>
      ))}
    </tbody></table></div>
  )
}
