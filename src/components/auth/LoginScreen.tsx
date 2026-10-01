import type { FormEvent } from 'react'

type LoginScreenProps = {
  authInput: string
  authError: string
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginScreen({ authInput, authError, onInputChange, onSubmit }: LoginScreenProps) {
  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <span>Saving</span>
          <h1>Nhập mã truy cập</h1>
        </div>
        <label>
          Mã authen
          <input
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            maxLength={5}
            type="password"
            value={authInput}
            onChange={(event) => onInputChange(event.target.value)}
          />
        </label>
        {authError ? <p className="auth-error" role="alert">{authError}</p> : null}
        <button type="submit">Vào app</button>
      </form>
    </main>
  )
}
