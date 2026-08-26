import { useState, type CSSProperties } from 'react'
import { useAuth } from './hooks/useAuth'
import { useFinanceData } from './hooks/useFinanceData'
import { screens } from './data/screens'
import { LoginScreen } from './components/auth/LoginScreen'
import { Sidebar } from './components/layout/Sidebar'
import { MobileTopbar } from './components/layout/MobileTopbar'
import { BottomNav } from './components/layout/BottomNav'
import { MonthPicker } from './components/layout/MonthPicker'
import { Notice } from './components/common/Notice'
import { DashboardScreen } from './components/dashboard/DashboardScreen'
import { CalendarScreen } from './components/calendar/CalendarScreen'
import { FixedScreen } from './components/fixed/FixedScreen'
import { CategoriesScreen } from './components/categories/CategoriesScreen'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, authInput, setAuthInput, authError, unlock } = useAuth()
  const data = useFinanceData(isAuthenticated)

  if (!isAuthenticated) {
    return (
      <LoginScreen
        authInput={authInput}
        authError={authError}
        onInputChange={setAuthInput}
        onSubmit={unlock}
      />
    )
  }

  const { screen, setScreen, activeProfile, selectedMonth, setSelectedMonth, loading, message } = data

  return (
    <div className="app-shell" style={{ '--accent': activeProfile.accent, '--accent-soft': activeProfile.soft_accent } as CSSProperties}>
      <MobileTopbar
        screen={screen}
        activeProfile={activeProfile}
        selectedMonth={selectedMonth}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onMonthChange={setSelectedMonth}
      />

      <Sidebar
        open={sidebarOpen}
        screen={screen}
        activeProfile={activeProfile}
        onNavigate={(next) => { setScreen(next); setSidebarOpen(false) }}
        onClose={() => setSidebarOpen(false)}
      />

      <BottomNav screen={screen} onNavigate={setScreen} />

      <main className="content">
        <header className="topbar">
          <div>
            <p>{activeProfile.name}</p>
            <h1>{screens.find((item) => item.id === screen)?.label}</h1>
          </div>
          <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />
        </header>

        <Notice message={message} />
        {loading ? <div className="notice">Đang tải dữ liệu...</div> : null}

        {screen === 'dashboard' ? <DashboardScreen data={data} /> : null}
        {screen === 'calendar' ? <CalendarScreen data={data} /> : null}
        {screen === 'fixed' ? <FixedScreen data={data} /> : null}
        {screen === 'categories' ? <CategoriesScreen data={data} /> : null}
      </main>
    </div>
  )
}

export default App
