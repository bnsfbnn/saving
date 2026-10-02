import { useState } from 'react'
import type { FinanceData } from '../../hooks/useFinanceData'
import { currency } from '../../utils/money'

export function GoalsScreen({ data }: { data: FinanceData }) {
  const { goals, addGoal, updateGoalSaved } = data
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  return <section className="goals-grid"><div className="panel"><div className="section-head"><div><h2>Mục tiêu tiết kiệm</h2><p>Biến kế hoạch thành tiến độ nhìn thấy mỗi ngày.</p></div></div><form className="goal-form" onSubmit={(event) => { event.preventDefault(); if (!name || !target || !deadline) return; addGoal({ name, target: Number(target), deadline }); setName(''); setTarget(''); setDeadline('') }}><label>Tên mục tiêu<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Quỹ du lịch" /></label><label>Số tiền mục tiêu<input type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="10000000" /></label><label>Hạn hoàn thành<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label><button type="submit">Thêm mục tiêu</button></form></div><div className="goal-list">{goals.length ? goals.map((goal) => { const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100)); return <article className="panel goal-card" key={goal.id}><div className="section-head"><div><h2>{goal.name}</h2><p>Hạn {goal.deadline}</p></div><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="goal-values"><span>{currency(goal.saved)} đã tích lũy</span><span>{currency(goal.target)}</span></div><label>Cập nhật số đã tích lũy<input type="number" min="0" value={goal.saved} onChange={(event) => updateGoalSaved(goal.id, Number(event.target.value))} /></label></article> }) : <div className="panel empty-state">Chưa có mục tiêu. Hãy tạo mục tiêu đầu tiên của bạn.</div>}</div></section>
}
