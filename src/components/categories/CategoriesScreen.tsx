import type { FinanceData } from '../../hooks/useFinanceData'
import { CategoryForm } from './CategoryForm'
import { CategoryTable } from './CategoryTable'

type CategoriesScreenProps = {
  data: FinanceData
}

export function CategoriesScreen({ data }: CategoriesScreenProps) {
  const {
    categoryDraft,
    setCategoryDraft,
    editingCategoryId,
    categories,
    saveCategory,
    removeCategory,
    startEditCategory,
    resetCategoryForm,
    seedDefaults,
  } = data

  return (
    <section className="split-layout">
      <CategoryForm
        draft={categoryDraft}
        editingId={editingCategoryId}
        onDraftChange={setCategoryDraft}
        onSave={() => void saveCategory()}
        onSeedDefaults={() => void seedDefaults()}
        onCancelEdit={resetCategoryForm}
      />

      <div className="panel category-list-panel">
        <h2>Danh sách category</h2>
        <CategoryTable
          categories={categories}
          onEdit={startEditCategory}
          onDelete={(id) => void removeCategory(id)}
        />
      </div>
    </section>
  )
}
