import { FormEvent, useState } from 'react'
import { useAuth } from '@/data/auth'
import { changePassword } from '@/lib/account'
import { errorText } from '@/lib/api'

/** 首次登录（或被重置后）必须先改密码，不让带着身份证后 6 位一直用 */
export function ForcePasswordPage() {
  const { me, refresh, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = String(form.get('next') ?? '')
    if (next !== String(form.get('again') ?? '')) {
      setError('两次新密码不一样')
      return
    }
    setBusy(true)
    setError('')
    try {
      await changePassword(String(form.get('old') ?? ''), next)
      await refresh()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <form onSubmit={onSubmit} className="sheet w-full max-w-[420px] space-y-4 rounded-sm border border-ink/20 px-6 py-6">
        <div>
          <h1 className="title-serif text-[20px]">先改个密码</h1>
          <p className="mt-1 text-[14px] text-ink2">
            {me?.account.name}，你现在用的是初始密码。改成只有你知道的，至少 8 位。
          </p>
        </div>
        <label className="block">
          <span className="label">当前密码</span>
          <input required name="old" type="password" autoComplete="current-password" className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">新密码</span>
          <input required name="next" type="password" minLength={8} autoComplete="new-password" className="field mt-1 w-full" />
        </label>
        <label className="block">
          <span className="label">再输一次</span>
          <input required name="again" type="password" minLength={8} autoComplete="new-password" className="field mt-1 w-full" />
        </label>
        {error ? (
          <p role="alert" className="text-[14px] text-cinnabar">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => void signOut()} className="btn btn-quiet">
            退出
          </button>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? '保存中' : '保存新密码'}
          </button>
        </div>
      </form>
    </div>
  )
}
