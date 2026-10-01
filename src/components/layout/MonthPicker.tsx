import { monthInputValue } from '../../utils/dates'

type MonthPickerProps = {
  selectedMonth: string
  onChange: (monthStart: string) => void
}

export function MonthPicker({ selectedMonth, onChange }: MonthPickerProps) {
  return (
    <div className="month-picker">
      <label>
        <input
          type="month"
          value={monthInputValue(selectedMonth)}
          onChange={(event) => {
            const value = event.target.value
            if (!value) return
            onChange(`${value}-01`)
          }}
        />
      </label>
    </div>
  )
}
