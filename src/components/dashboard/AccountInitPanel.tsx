type AccountInitPanelProps = {
  openingBalanceInput: string
  onInputChange: (value: string) => void
  onSubmit: () => void
}

/** First-time setup prompt: shown when the profile has no account settings yet. */
export function AccountInitPanel({ openingBalanceInput, onInputChange, onSubmit }: AccountInitPanelProps) {
  return (
    <section className="panel account-init-panel">
      <div className="account-init-content">
        <span className="account-init-icon">🏦</span>
        <h2>Bắt đầu tiết kiệm</h2>
        <p>Nhập số dư ban đầu (số tiền hiện có) để bắt đầu theo dõi tài chính.</p>
        <div className="form-grid inline-form">
          <label>
            Số dư ban đầu (VND)
            <input inputMode="decimal" value={openingBalanceInput} onChange={(event) => onInputChange(event.target.value)} placeholder="Ví dụ: 5000000" />
          </label>
          <button onClick={onSubmit} type="button">Bắt đầu</button>
        </div>
      </div>
    </section>
  )
}
