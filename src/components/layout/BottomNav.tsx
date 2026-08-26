import type { Screen } from '../../types'
import { screens } from '../../data/screens'

type BottomNavProps = {
  screen: Screen
  onNavigate: (screen: Screen) => void
}

export function BottomNav({ screen, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav">
      {screens.map((item) => (
        <button
          className={screen === item.id ? 'bottom-nav-btn active' : 'bottom-nav-btn'}
          key={item.id}
          onClick={() => onNavigate(item.id)}
          type="button"
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
