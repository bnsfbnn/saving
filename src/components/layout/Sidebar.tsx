import type { Profile, Screen } from '../../types'
import { screens } from '../../data/screens'

type SidebarProps = {
  open: boolean
  screen: Screen
  activeProfile: Profile
  onNavigate: (screen: Screen) => void
  onClose: () => void
}

export function Sidebar({ open, screen, activeProfile, onNavigate, onClose }: SidebarProps) {
  return (
    <>
      {open ? <div className="sidebar-overlay" onClick={onClose} /> : null}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-block">
          <span>Saving</span>
          <strong>Quản lý thu chi</strong>
        </div>

        <div className="profile-switcher" aria-label="Tài khoản hiện tại">
          <div className="profile-dropdown-row">
            <div className="profile-summary">
              <span className="profile-dot" style={{ backgroundColor: activeProfile.color }} />
              <strong>{activeProfile.name}</strong>
            </div>
          </div>
        </div>

        <nav className="nav-list">
          {screens.map((item) => (
            <button
              className={screen === item.id ? 'nav-button active' : 'nav-button'}
              key={item.id}
              onClick={() => onNavigate(item.id)}
              type="button"
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
