import { Banxin, Section } from '@/components/NineFormsPages'
import type { CaseChapter, CasePlate, CaseRecord } from '@/content/cases'
import { FORMS } from '@/content/forms'
import type { GujiPage } from '@/components/GujiBook'
import { cnNum } from '@/lib/numerals'

const H = 'flex min-h-[560px] flex-col md:h-[640px] md:flex-row'

/** 截图：装在一层纸框里，旧纸色调，注明已脱敏 */
function Plate({ plate, className }: { plate: CasePlate; className?: string }) {
  return (
    <figure className={className}>
      <div className="border border-ink/30 bg-[#f7efdd] p-1.5 shadow-[0_10px_20px_-14px_rgba(28,26,23,0.6)]">
        <img
          src={plate.src}
          alt={`${plate.caption}（截图已脱敏）`}
          loading="lazy"
          decoding="async"
          className="block w-full [filter:sepia(0.22)_saturate(0.75)_contrast(0.96)]"
        />
      </div>
      <figcaption className="kai mt-2 text-[13.5px] leading-snug text-ink/65">
        {plate.caption}
      </figcaption>
    </figure>
  )
}

/** 封面：磁青函套，题签写行业，三张截图斜叠像夹在书里的页 */
function CaseCover({ item, vol }: { item: CaseRecord; vol: number }) {
  return (
    <div className="relative flex min-h-[560px] overflow-hidden bg-[#2b3a3f] text-[#efe3c6] md:h-[640px]">
      <div aria-hidden className="relative w-12 shrink-0 border-r border-[#efe3c6]/15 sm:w-16">
        {[10, 36, 64, 90].map((top) => (
          <span key={top} className="absolute left-0 h-px w-full bg-[#efe3c6]/40" style={{ top: `${top}%` }}>
            <span className="absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#141917] ring-1 ring-[#efe3c6]/45 sm:right-4" />
          </span>
        ))}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_75%_70%_at_78%_22%,#000,transparent_75%)]"
        style={{ backgroundImage: "url('/art/sajin.webp')", backgroundSize: '520px' }}
      />

      <div className="relative flex min-h-0 flex-1 flex-col gap-6 p-8 sm:p-12">
        <div className="flex self-start border border-[#1c1a17]/60 bg-[#efe3c6] px-3 py-5 text-ink shadow-[0_12px_24px_-14px_rgba(0,0,0,0.85)] sm:px-5 sm:py-7">
          <p className="kai vertical mr-2 self-end text-[15px] tracking-[0.35em] text-ink/70 sm:text-[17px]">案例集 · 卷{cnNum(vol)}</p>
          <h3 className="brush vertical text-[48px] leading-[1.1] tracking-[0.12em] sm:text-[64px]">{item.short ?? item.industry}</h3>
        </div>
        <div className="mt-auto max-w-[22em]">
          <p className="kai text-[14px] tracking-[0.3em] text-[#efe3c6]/60">{item.industry}</p>
          {item.ledger ? (
            <p className="kai mt-2 text-[15px] leading-[1.9] text-[#efe3c6]/80">
              {item.ledger.span} · {item.ledger.headline}
            </p>
          ) : null}
        </div>
      </div>

      {/* 夹在书里的几页截图 */}
      <div aria-hidden className="relative hidden w-[46%] shrink-0 lg:block">
        {item.plates.slice(0, 3).map((plate, i) => (
          <img
            key={plate.src}
            src={plate.src}
            alt=""
            loading="lazy"
            className="absolute w-[78%] border-[6px] border-[#efe3c6] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.75)] [filter:sepia(0.25)_saturate(0.7)]"
            style={{ top: `${14 + i * 18}%`, right: `${8 + i * 7}%`, transform: `rotate(${[-4, 2.5, -1.5][i]}deg)` }}
          />
        ))}
      </div>
    </div>
  )
}

/** 目录：先讲生意和怎么驻场，再按九式一章一章 */
function CaseContents({ item, onPick }: { item: CaseRecord; onPick: (page: number) => void }) {
  const chapters = item.chapters ?? []
  return (
    <div className={H}>
      <div className="shrink-0 p-6 md:w-[32%] md:p-10">
        <h3 className="brush text-[52px] leading-none sm:text-[64px]">目录</h3>
        <p className="kai mt-6 max-w-[16em] text-[16px] leading-[2] text-ink/70">
          先看投入和产出，再看这门生意，然后按剑来九式一章一章看。
        </p>
      </div>
      <Banxin book="剑来案例集" label="目录" folio="二" />
      <ol className="flex-1 border-t border-ink/30 md:flex md:flex-col md:justify-center md:border-t-0 md:px-8 md:py-6">
        {[
          ...(item.ledger ? [{ k: '账页', name: '投入', line: '多久、几个人、交了什么、怎么干', page: 2 }] : []),
          { k: '序', name: '生意', line: '两门生意怎么赚钱，怎么盘活', page: item.ledger ? 3 : 2 },
          { k: '序', name: '驻场', line: '人怎么进去，怎么做', page: item.ledger ? 4 : 3 },
          ...chapters.map((c, i) => ({ k: `第${cnNum(i + 1)}式`, name: c.form, line: c.title, page: i + (item.ledger ? 5 : 4) })),
        ].map((row) => (
          <li key={row.name}>
            <button
              type="button"
              onClick={() => onPick(row.page)}
              className="group grid w-full grid-cols-[3.5rem_3.6rem_1fr] items-baseline gap-3 border-b border-ink/20 px-6 py-2.5 text-left transition-colors hover:bg-ink/[0.04] md:px-2 md:py-2"
            >
              <span className="kai text-[14px] text-ink/55">{row.k}</span>
              <span className="brush text-[24px] leading-none transition-colors group-hover:text-cinnabar">{row.name}</span>
              <span className="text-[15px] text-ink/80">{row.line}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** 账页：投入与产出。左半叶是时间线（谁、什么时候、做了什么），右半叶是交付和怎么干。不写价格 */
function LedgerPage({ item }: { item: CaseRecord }) {
  const l = item.ledger
  if (!l) return null
  return (
    <div className={H}>
      <div className="flex shrink-0 flex-col gap-4 p-6 md:w-[42%] md:p-8">
        <p className="kai text-[15px] text-ink/55">账页 · {l.span}</p>
        <p className="brush text-[40px] leading-[1.1] text-cinnabar sm:text-[44px]">{l.headline}</p>
        <p className="kai text-[15px] text-ink/70">{l.team}</p>
        <ol className="relative mt-1 space-y-3 border-l border-ink/30 pl-5">
          {l.phases.map((p) => (
            <li key={p.when} className="relative">
              <span aria-hidden className="absolute -left-[25px] top-[0.45em] h-2.5 w-2.5 rounded-full border-[1.5px] border-cinnabar bg-[#f2e7cf]" />
              <p className="kai text-[14px] text-ink/60">
                {p.when}
                <span className="ml-2 text-cinnabar/85">{p.who}</span>
              </p>
              <p className="text-[15px] leading-[1.65] text-ink/85">{p.what}</p>
            </li>
          ))}
        </ol>
      </div>
      <Banxin book="剑来案例集" label="账页 · 投入与产出" folio="三" />
      <div className="flex flex-1 flex-col justify-center gap-4 border-t border-ink/20 p-6 md:border-t-0 md:px-8">
        <div>
          <p className="kai mb-1.5 text-[15px] text-ink/55">交了什么</p>
          <dl className="space-y-1.5">
            {l.output.map((o) => (
              <div key={o.k} className="grid grid-cols-[2.4rem_1fr] gap-3 border-b border-ink/15 pb-1.5 last:border-b-0">
                <dt className="brush text-[20px] leading-[1.3] text-cinnabar">{o.k}</dt>
                <dd className="text-[15px] leading-[1.7] text-ink/85">{o.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <p className="kai mb-2 text-[15px] text-ink/55">怎么干的</p>
          <dl className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
            {l.craft.map((c) => (
              <div key={c.k} className="flex gap-2.5">
                <dt className="brush shrink-0 text-[26px] leading-none text-ink">{c.k}</dt>
                <dd className="text-[14px] leading-[1.7] text-ink/75">{c.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="kai text-[12.5px] leading-[1.6] text-ink/45">注：{l.basis}</p>
      </div>
    </div>
  )
}

/** 序一：生意。两条线怎么赚钱，链路，卡点和盘活 */
function ModelPage({ item }: { item: CaseRecord }) {
  const m = item.model
  if (!m) return null
  return (
    <div className={H}>
      <div className="flex shrink-0 flex-col gap-5 p-6 md:w-[40%] md:p-10">
        <p className="kai text-[15px] text-ink/55">序一 · 生意</p>
        <p className="text-[19px] font-semibold leading-[1.7]">{m.lead}</p>
        {/* 一笔钱走过的路 */}
        <ol className="flex flex-wrap items-center gap-y-3">
          {m.flow.map((step, i) => (
            <li key={step} className="flex items-center">
              <span className="kai border border-ink/45 bg-[#f6ecd6] px-2.5 py-1 text-[15px]">{step}</span>
              {i < m.flow.length - 1 ? <span aria-hidden className="mx-1.5 text-cinnabar">→</span> : null}
            </li>
          ))}
        </ol>
        {m.insight ? (
          <p className="kai mt-auto border-l-2 border-cinnabar/70 pl-4 text-[16px] leading-[1.9] text-cinnabar/90">{m.insight}</p>
        ) : null}
      </div>
      <Banxin book="剑来案例集" label="序一 · 生意" folio={cnNum(item.ledger ? 4 : 3)} />
      <dl className="flex flex-1 flex-col justify-center gap-4 border-t border-ink/20 p-6 md:border-t-0 md:px-10">
        {m.lines.map((line) => (
          <div key={line.k} className="grid grid-cols-[3.2rem_1fr] gap-3 border-b border-ink/15 pb-3 last:border-b-0">
            <dt className="brush text-[26px] leading-none text-cinnabar">{line.k}</dt>
            <dd className="text-[16px] leading-[1.85] text-ink/85">{line.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** 序二：驻场。怎么进去、怎么做 */
function VisitPage({ item }: { item: CaseRecord }) {
  const visit = item.visit ?? []
  return (
    <div className={H}>
      <div className="relative flex shrink-0 gap-6 p-6 md:w-[34%] md:p-10">
        <div className="flex shrink-0 flex-col items-center border-r border-ink/25 pr-5">
          <p className="kai vertical text-[16px] tracking-[0.4em] text-ink/60">序二</p>
          <h3 className="brush vertical mt-3 text-[84px] leading-none sm:text-[100px]">驻场</h3>
        </div>
        <div className="flex min-w-0 flex-col gap-4 pt-1">
          <p className="text-[18px] font-semibold leading-snug">线上线下结合</p>
          <p className="kai text-[16px] leading-[2] text-ink/75">道长一人先驻场摸底；暑期剑修入场，集中驻场两个月。</p>
          <img src="/art/jiangzhou.webp" alt="" aria-hidden className="ink-river mt-auto w-full opacity-50" />
        </div>
      </div>
      <Banxin book="剑来案例集" label="序二 · 驻场" folio={cnNum(item.ledger ? 5 : 4)} />
      <ol className="flex flex-1 flex-col justify-center gap-4 border-t border-ink/20 p-6 md:border-t-0 md:px-10">
        {visit.map((line, i) => (
          <li key={line} className="grid grid-cols-[2rem_1fr] text-[16px] leading-[1.85] text-ink/85">
            <span className="brush text-[24px] leading-none text-cinnabar">{cnNum(i + 1)}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** 一章：左半叶式名、所斩、截图；右半叶做了什么、眉批 */
function ChapterPage({ chapter, index, offset }: { chapter: CaseChapter; index: number; offset: number }) {
  const form = FORMS.find((f) => f.name === chapter.form)
  return (
    <div className={H}>
      <div className="flex shrink-0 flex-col gap-4 p-6 md:w-[48%] md:p-8">
        <div className="flex items-baseline gap-3">
          <span className="kai text-[15px] text-ink/55">第{cnNum(index + 1)}式</span>
          <h3 className="brush text-[48px] leading-none">{chapter.form}</h3>
          {form ? <span className="kai text-[14px] text-ink/50">{form.term}</span> : null}
        </div>
        <p className="text-[19px] font-semibold leading-snug">{chapter.title}</p>
        {chapter.plate ? <Plate plate={chapter.plate} className="mt-auto" /> : null}
      </div>
      <Banxin book="剑来案例集" label={`第${cnNum(index + 1)}式 · ${chapter.form}`} folio={cnNum(index + offset)} />
      <div className="flex flex-1 flex-col justify-center gap-4 border-t border-ink/20 p-6 md:border-t-0 md:px-9 md:py-8">
        <section>
          <h4 className="kai text-[16px] tracking-[0.12em] text-cinnabar">〔进场时〕</h4>
          <p className="mt-1.5 text-[16px] leading-[1.85] text-ink/85">
            <span className="zhu-dot-under">{chapter.body}</span>
          </p>
        </section>
        <Section title="我们做了" items={chapter.did} />
        {chapter.note ? (
          <p
            className="kai relative mt-1 rotate-[-0.5deg] pl-5 text-[15px] leading-[1.75] text-cinnabar/90"
            aria-label="驻场眉批"
          >
            <span aria-hidden className="absolute left-0 top-[0.55em] h-2.5 w-2.5 rounded-full border-[1.5px] border-cinnabar/80" />
            {chapter.note}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** 一册案例 → 一叠书页：封面、目录、两页序、九章 */
export function casePages(item: CaseRecord, vol: number, go: (page: number) => void): GujiPage[] {
  const chapters = item.chapters ?? []
  return [
    { name: '封面', cover: true, render: () => <CaseCover item={item} vol={vol} /> },
    { name: '目录', render: () => <CaseContents item={item} onPick={go} /> },
    ...(item.ledger ? [{ name: '账页 · 投入与产出', tab: '账', render: () => <LedgerPage item={item} /> }] : []),
    { name: '序一 · 生意', tab: '生', render: () => <ModelPage item={item} /> },
    { name: '序二 · 驻场', tab: '驻', render: () => <VisitPage item={item} /> },
    ...chapters.map((chapter, i) => ({
      name: `第${cnNum(i + 1)}式 · ${chapter.form}`,
      tab: cnNum(i + 1),
      render: () => <ChapterPage chapter={chapter} index={i} offset={item.ledger ? 6 : 5} />,
    })),
  ]
}
