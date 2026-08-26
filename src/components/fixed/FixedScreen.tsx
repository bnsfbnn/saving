import type { FinanceData } from '../../hooks/useFinanceData'
import { FixedExpenseForm } from './FixedExpenseForm'
import { FixedExpenseList } from './FixedExpenseList'
import { currency } from '../../utils/money'

type FixedScreenProps = {
  data: FinanceData
}

export function FixedScreen({ data }: FixedScreenProps) {
  const {
    fixedDraft,
    setFixedDraft,
    editingFixedExpenseId,
    fixedCategories,
    profileFixedExpenses,
    categoryLookup,
    monthlySummary,
    saveFixedExpense,
    removeFixedExpense,
    startEditFixedExpense,
    resetFixedExpenseForm,
  } = data

  return (
    <section className="split-layout">
      <FixedExpenseForm
        draft={fixedDraft}
        editingId={editingFixedExpenseId}
        fixedCategories={fixedCategories}
        onDraftChange={setFixedDraft}
        onSave={() => void saveFixedExpense()}
        onCancelEdit={resetFixedExpenseForm}
      />

      <div className="panel fixed-list-panel">
        <div className="section-head"><h2>Danh sách chi cố định</h2><strong>{currency(monthlySummary.fixedExpense)}</strong></div>
        <FixedExpenseList
          items={profileFixedExpenses}
          categoryLookup={categoryLookup}
          onEdit={startEditFixedExpense}
          onDelete={(id) => void removeFixedExpense(id)}
        />
      </div>
    </section>
  )
}
