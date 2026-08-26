import type { AccountSettings, Profile } from '../../types'
import { currency } from '../../utils/money'

type AccountHeroCardProps = {
  activeProfile: Profile
  accountSettings: AccountSettings
  mainBalance: number
  totalIncomeAllTime: number
  totalExpenseAllTime: number
}

export function AccountHeroCard({ activeProfile, accountSettings, mainBalance, totalIncomeAllTime, totalExpenseAllTime }: AccountHeroCardProps) {
  return (
    <section className="account-hero-card">
      <div className="account-hero-top">
        <span className="account-hero-label">💰 {activeProfile.name} — Tài khoản chính</span>
        <span className="account-hero-hint">Khởi đầu + Tổng còn lại</span>
      </div>
      <div className="account-hero-balance">
        <span className={mainBalance >= 0 ? 'money-positive' : 'money-negative'}>{currency(mainBalance)}</span>
      </div>
      <div className="account-hero-sub">
        <span>Khởi đầu: <strong>{currency(accountSettings.opening_balance)}</strong></span>
        <span>Thu: <strong className="money-positive">+{currency(totalIncomeAllTime)}</strong></span>
        <span>Chi: <strong className="money-negative">−{currency(totalExpenseAllTime)}</strong></span>
      </div>
    </section>
  )
}
