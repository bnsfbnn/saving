import type { FinanceData } from '../../hooks/useFinanceData'
import { weekDayLabels } from '../../data/defaults'
import { currency } from '../../utils/money'
import { TransactionForm } from '../transactions/TransactionForm'
import { TransactionList } from '../transactions/TransactionList'

type CalendarScreenProps = {
  data: FinanceData
}

export function CalendarScreen({ data }: CalendarScreenProps) {
  const {
    calendarDays,
    monthTransactions,
    categoryLookup,
    transactionDraft,
    setTransactionDraft,
    editingTransactionId,
    incomeCategories,
    expenseCategories,
    saveTransaction,
    removeTransaction,
    startEditTransaction,
    resetTransactionForm,
    prepareExpenseForDate,
  } = data

  return (
    <section className="calendar-layout">
      <div className="panel calendar-panel">
        <div className="calendar-weekdays">
          {weekDayLabels.map((label) => <span key={label}>{label.slice(0, 3)}</span>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map((day) => {
            const dayTransactions = monthTransactions.filter((t) => t.occurred_on === day.iso)
            return (
              <button className={day.inMonth ? 'calendar-day' : 'calendar-day outside'} key={day.iso} onClick={() => prepareExpenseForDate(day.iso)} type="button">
                <strong>{day.dayNumber}</strong>
                <div className="day-items">
                  {dayTransactions.slice(0, 3).map((transaction) => {
                    const category = categoryLookup.get(transaction.category_id)
                    return (
                      <span key={transaction.id} className={transaction.type === 'income' ? 'day-item-income' : 'day-item-expense'}>
                        {category?.name ?? (transaction.type === 'income' ? 'Thu' : 'Chi')} · {currency(transaction.amount)}
                      </span>
                    )
                  })}
                  {dayTransactions.length > 3 ? <em>+{dayTransactions.length - 3}</em> : null}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="side-stack">
        <TransactionForm
          title="Ghi thu / chi"
          draft={transactionDraft}
          editingId={editingTransactionId}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          onDraftChange={setTransactionDraft}
          onSave={(typeOverride) => void saveTransaction(typeOverride)}
          onCancelEdit={() => resetTransactionForm(transactionDraft.occurred_on)}
        />
        <section className="panel">
          <div className="section-head">
            <h2>Giao dịch trong tháng</h2>
            <span>{monthTransactions.length} giao dịch</span>
          </div>
          <TransactionList
            items={monthTransactions}
            categoryLookup={categoryLookup}
            onEdit={startEditTransaction}
            onDelete={(id) => void removeTransaction(id)}
          />
        </section>
      </div>
    </section>
  )
}
