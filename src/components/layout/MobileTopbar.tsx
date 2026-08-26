import type { Profile, Screen } from '../../types'
import { screens } from '../../data/screens'
import { monthInputValue } from '../../utils/dates'

type MobileTopbarProps = {
  screen: Screen
  activeProfile: Profile
  selectedMonth: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onMonthChange: (monthStart: string) => void
}

export function MobileTopbar({ screen, activeProfile, selectedMonth, sidebarOpen, onToggleSidebar, onMonthChange }: MobileTopbarProps) {
  return (
    <header className="mobile-topbar">
      <button className="hamburger-btn" onClick={onToggleSidebar} type="button">
        {sidebarOpen ? '✕' : '☰'}
      </button>
      <div className="mobile-topbar-info">
        <strong>{activeProfile.name}</strong>
        <span>{screens.find((item) => item.id === screen)?.label}</span>
      </div>
      <div className="mobile-topbar-right">
        <label className="mobile-month-picker" aria-label="Chọn tháng">
          <input
            type="month"
            value={monthInputValue(selectedMonth)}
            onChange={(event) => {
              const value = event.target.value
              if (!value) return
              onMonthChange(`${value}-01`)
            }}
          />
        </label>
      </div>
    </header>
  )
}
