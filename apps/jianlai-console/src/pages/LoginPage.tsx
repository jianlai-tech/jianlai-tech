import { FormEvent, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/data/auth'
import { login } from '@/lib/account'
import { errorText } from '@/lib/api'
import { asset, cn } from '@/lib/cn'

type Door = 'staff' | 'client'

const DOORS: Record<Door, { tab: string; hint: string; pwHint: string }> = {
  staff: {
    tab: '剑来同门',
    hint: '驻场、主理人用。',
    pwHint: '密码是身份证后 6 位，末位 X 用大写。想改的话进「我的档案」。',
  },
  client: {
    tab: '合作企业',
    hint: '看自己公司的项目进度和驻场的人。',
    pwHint: '账号在付款确认后由剑来开通，密码见开通短信或主理人发给你的消息。',
  },
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [door, setDoor] = useState<Door>('staff')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    try {
      const res = await login(String(form.get('phone') ?? '').trim(), String(form.get('password') ?? ''))
      if (res.account.kind !== door) {
        setDoor(res.account.kind)
      }
      await signIn(res.token)
      if (res.account.kind === 'client') {
        await navigate({ to: '/project', replace: true })
      } else if (res.account.is_admin) {
        await navigate({ to: '/', replace: true })
      } else {
        await navigate({ to: '/me', replace: true })
      }
    } catch (err) {
      setError(errorText(err, '登录失败'))
      setBusy(false)
    }
  }

  const copy = DOORS[door]

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-[420px]">
        <a href="/" className="mb-6 flex items-center gap-3 no-underline">
          <span className="grid h-11 w-11 place-items-center rounded-sm bg-rail">
            <img src={asset('/brand/jian-glyph.png')} alt="" className="h-9 w-9 object-contain invert" />
          </span>
          <span>
            <span className="title-serif block text-[20px] tracking-[0.12em] text-ink">剑来科技</span>
            <span className="kai block text-[13px] text-ink3">后台登录</span>
          </span>
        </a>

        <div className="sheet rounded-sm border border-ink/20">
          <div role="tablist" aria-label="账号类型" className="grid grid-cols-2 border-b border-ink/15">
            {(Object.keys(DOORS) as Door[]).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={door === key}
                onClick={() => {
                  setDoor(key)
                  setError('')
                }}
                className={cn(
                  '-mb-px h-12 border-b-2 text-[15px] font-semibold transition-colors duration-150',
                  door === key ? 'border-cinnabar text-ink' : 'border-transparent text-ink3 hover:text-ink',
                )}
              >
                {DOORS[key].tab}
              </button>
            ))}
          </div>

          <form className="space-y-4 px-6 py-6" onSubmit={onSubmit}>
            <p className="text-[14px] text-ink2">{copy.hint}</p>
            <label className="block">
              <span className="label">手机号</span>
              <input
                required
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="1[0-9]{10}"
                maxLength={11}
                autoComplete="username"
                className="field mt-1 w-full"
              />
            </label>
            <label className="block">
              <span className="label">密码</span>
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                className="field mt-1 w-full"
              />
            </label>
            <p className="kai text-[13px] leading-5 text-ink3">{copy.pwHint}</p>
            {error ? (
              <p role="alert" className="text-[14px] text-cinnabar">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy} className="btn btn-primary h-10 w-full justify-center">
              {busy ? '登录中' : '登录'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[13px] text-ink3">
          忘记密码找主理人重置。还没合作？
          <a href="/start" className="ml-1 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-cinnabar">
            先聊聊
          </a>
        </p>
      </div>
    </div>
  )
}
