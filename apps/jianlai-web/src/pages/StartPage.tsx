import { FormEvent, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getHttpErrorMessage } from '@/lib/http'
import { submitLead } from '@/lib/api/leads'

const SCENES = ['未选', '家教教培', '分销批发', '制造贸易', '其他'] as const

export function StartPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setStatus('sending')
    setMessage('')
    try {
      await submitLead({
        company_name: String(form.get('company_name') ?? ''),
        contact_name: String(form.get('contact_name') ?? ''),
        phone: String(form.get('phone') ?? ''),
        wechat: String(form.get('wechat') ?? '') || undefined,
        scene: String(form.get('scene') ?? '未选'),
        note: String(form.get('note') ?? '') || undefined,
      })
      setStatus('ok')
      event.currentTarget.reset()
    } catch (err) {
      setStatus('err')
      setMessage(getHttpErrorMessage(err, '没送出去，等下再试'))
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <Link to="/" className="text-sm text-neutral-500">
        回首页
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">留个联系方式</h1>
      <p className="mt-2 text-neutral-600">我们会打电话或加微信，先看能不能驻场。</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          公司
          <input
            required
            name="company_name"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          联系人
          <input
            required
            name="contact_name"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          手机
          <input
            required
            name="phone"
            inputMode="numeric"
            pattern="1[0-9]{10}"
            className="mt-1 w-full rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          微信（可空）
          <input name="wechat" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          场景
          <select name="scene" defaultValue="未选" className="mt-1 w-full rounded border border-neutral-300 px-3 py-2">
            {SCENES.map((scene) => (
              <option key={scene} value={scene}>
                {scene}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          现在卡在哪（可空）
          <textarea name="note" rows={3} className="mt-1 w-full rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {status === 'sending' ? '在送' : '交给见来'}
        </button>
        {status === 'ok' ? <p className="text-sm text-neutral-700">收到了，我们会联系你。</p> : null}
        {status === 'err' ? <p className="text-sm text-red-700">{message}</p> : null}
      </form>
    </main>
  )
}
