import { FORMS, ORDINALS, type Form } from '@/content/forms'

/** 鱼尾：版心里的黑鱼尾，古籍折页对齐用 */
export function FishTail({ flip }: { flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 20 14" className={`block w-5 ${flip ? 'rotate-180' : ''}`}>
      <path d="M0 0H20V14L10 7.5L0 14Z" fill="#1c1a17" />
    </svg>
  )
}

/** 版心：书页中缝，题书名、卷次、页码 */
export function Banxin({ label, folio, book = '剑来剑谱' }: { label: string; folio: string; book?: string }) {
  return (
    <div aria-hidden className="guji-banxin hidden w-11 shrink-0 flex-col items-center gap-3 py-5 md:flex">
      <span className="kai vertical text-[13px] tracking-[0.35em] text-ink/70">{book}</span>
      <FishTail />
      <span className="kai vertical flex-1 text-[13px] tracking-[0.3em] text-ink/80">{label}</span>
      <FishTail flip />
      <span className="kai vertical text-[12px] tracking-[0.2em] text-ink/55">{folio}</span>
    </div>
  )
}

function folioOf(page: number) {
  return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一'][page] ?? String(page + 1)
}

export function Cover() {
  return (
    <div className="relative flex min-h-[560px] overflow-hidden bg-[#26302f] text-[#efe3c6] md:h-[600px]">
      {/* 线装：书脊在左，四眼订线 */}
      <div aria-hidden className="relative w-12 shrink-0 border-r border-[#efe3c6]/15 sm:w-16">
        {[10, 36, 64, 90].map((top) => (
          <span key={top} className="absolute left-0 h-px w-full bg-[#efe3c6]/40" style={{ top: `${top}%` }}>
            <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#141917] ring-1 ring-[#efe3c6]/45 sm:right-4" />
          </span>
        ))}
      </div>

      {/* 磁青纸的细纹 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(239,227,198,0.035) 0 1px, transparent 1px 4px), radial-gradient(ellipse at 70% 20%, rgba(239,227,198,0.08), transparent 60%)',
        }}
      />
      {/* 磁青洒金：金箔碎屑稀稀落落，近书脊处淡一些 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_75%_70%_at_78%_22%,#000,transparent_75%)]"
        style={{ backgroundImage: "url('/art/sajin.webp')", backgroundSize: '520px' }}
      />

      <div className="relative flex flex-1 flex-col p-8 sm:p-12">
        {/* 题签：贴在封面左上，靠书脊 */}
        <div className="flex self-start border border-[#1c1a17]/60 bg-[#efe3c6] px-3 py-5 text-ink shadow-[0_12px_24px_-14px_rgba(0,0,0,0.85)] sm:px-5 sm:py-7">
          <p className="kai vertical mr-2 self-end text-[15px] tracking-[0.35em] text-ink/70 sm:text-[17px]">九式卷</p>
          <h3 className="brush vertical text-[46px] leading-[1.1] tracking-[0.14em] sm:text-[66px]">剑来剑谱</h3>
        </div>

        <p className="kai mt-auto max-w-[19em] self-end text-right text-[16px] leading-[2] text-[#efe3c6]/80 sm:text-[17px]">
          驻场进一家公司能斩掉什么，一式一页：要你准备什么，我们在现场做什么，做完是什么样。
        </p>
      </div>
    </div>
  )
}

export function Contents({ onPick }: { onPick: (index: number) => void }) {
  return (
    <div className="flex min-h-[560px] flex-col md:h-[600px] md:flex-row">
      <div className="shrink-0 p-6 md:w-[34%] md:p-10">
        <h3 className="brush text-[52px] leading-none sm:text-[64px]">目录</h3>
        <p className="kai mt-6 max-w-[16em] text-[16px] leading-[2] text-ink/70">
          九式不必全练。先找说中你公司最疼处的那一式，从那里起手。
        </p>
      </div>

      <Banxin label="目录" folio={folioOf(1)} />

      <ol className="flex-1 border-t border-ink/30 md:flex md:flex-col md:justify-center md:border-t-0 md:px-8 md:py-6">
        {FORMS.map((form, index) => (
          <li key={form.name}>
            <button
              type="button"
              onClick={() => onPick(index)}
              className="group grid w-full grid-cols-[3.5rem_4rem_1fr_auto] items-baseline gap-3 border-b border-ink/20 px-6 py-3 text-left transition-colors hover:bg-ink/[0.04] md:px-2 md:py-2.5"
            >
              <span className="kai text-[14px] text-ink/55">第{ORDINALS[index]}式</span>
              <span className="brush text-[26px] leading-none transition-colors group-hover:text-cinnabar">{form.name}</span>
              <span className="text-[15px] text-ink/80 sm:text-[16px]">{form.line}</span>
              <span aria-hidden className="kai hidden text-[13px] text-ink/40 transition-transform group-hover:translate-x-1 sm:inline">
                {folioOf(index + 2)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="border-t border-ink/25 pt-3 first:border-t-0 first:pt-0">
      <h4 className="kai text-[16px] tracking-[0.12em] text-cinnabar">〔{title}〕</h4>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[1.1rem_1fr] text-[16px] leading-[1.8] text-ink/85">
            <span aria-hidden className="text-cinnabar">。</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function FormPage({ form, index }: { form: Form; index: number }) {
  return (
    <div className="flex min-h-[560px] flex-col md:h-[600px] md:flex-row">
      {/* 左半叶：式名竖题，术语和所斩 */}
      <div className="relative flex shrink-0 gap-6 p-6 md:w-[38%] md:p-10">
        <div className="flex shrink-0 flex-col items-center border-r border-ink/25 pr-5">
          <p className="kai vertical text-[16px] tracking-[0.4em] text-ink/60">第{ORDINALS[index]}式</p>
          <h3 className="brush vertical mt-3 text-[84px] leading-none sm:text-[104px]">{form.name}</h3>
        </div>
        <div className="flex min-w-0 flex-col gap-5 pt-1">
          <p className="text-[18px] font-semibold leading-snug">{form.term}</p>
          <div>
            <p className="kai text-[15px] text-cinnabar">所斩</p>
            <p className="mt-1 text-[16px] leading-[2] text-ink/85">
              <span className="zhu-dot-under">{form.slays}</span>
            </p>
          </div>
          <p className="brush mt-auto text-[26px] leading-snug text-ink/80">{form.line}</p>
        </div>
      </div>

      <Banxin label={`第${ORDINALS[index]}式 · ${form.name}`} folio={folioOf(index + 2)} />

      {/* 右半叶：准备、做法、成效 */}
      <div className="flex flex-1 flex-col justify-center gap-4 border-t border-ink/20 p-6 md:border-t-0 md:px-10 md:py-8">
        <Section title="你要准备" items={form.prepare} />
        <Section title="驻场在现场做" items={form.actions} />
        <Section title="做完之后" items={form.outcome} />
      </div>
    </div>
  )
}
