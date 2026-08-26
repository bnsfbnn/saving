type NoticeProps = {
  message: string
}

export function Notice({ message }: NoticeProps) {
  if (!message) return null
  return <div className="notice">{message}</div>
}
