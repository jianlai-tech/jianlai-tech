import { FormEvent, useState } from 'react'
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
    <main className="mx-auto max-w-xl px-5 pb-16">
      <h1 className="font-mark text-5xl leading-tight sm:text-6xl">留个联系方式</h1>
      <p className="mt-4 max-w-prose text-lg text-ink/80">
        我们会打电话或加微信，先看能不能驻场。
      </p>
      <form
        className="relative mt-8 max-w-md rotate-[0.4deg] border border-ink/15 bg-white/50 px-5 py-6"
        onSubmit={onSubmit}
      >
        <span className="zine-tape -top-2 left-10 -rotate-6" />
        <label className="block font-doodle">
          公司
          <input required name="company_name" className="zine-field" />
        </label>
        <label className="mt-5 block font-doodle">
          联系人
          <input required name="contact_name" className="zine-field" />
        </label>
        <label className="mt-5 block font-doodle">
          手机
          <input
            required
            name="phone"
            inputMode="numeric"
            pattern="1[0-9]{10}"
            className="zine-field"
          />
        </label>
        <label className="mt-5 block font-doodle">
          微信（可空）
          <input name="wechat" className="zine-field" />
        </label>
        <label className="mt-5 block font-doodle">
          场景
          <select name="scene" defaultValue="未选" className="zine-field">
            {SCENES.map((scene) => (
              <option key={scene} value={scene}>
                {scene}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-5 block font-doodle">
          现在卡在哪（可空）
          <textarea name="note" rows={3} className="zine-field resize-none" />
        </label>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="zine-cta mt-7 disabled:opacity-50"
        >
          {status === 'sending' ? '在送' : '交给剑来'}
        </button>
        {status === 'ok' ? (
          <p className="mt-3 font-doodle text-lake">收到了，我们会联系你。</p>
        ) : null}
        {status === 'err' ? (
          <p className="mt-3 font-doodle text-blush">{message}</p>
        ) : null}
      </form>
    </main>
  )
}
