import { Link } from '@tanstack/react-router'
import { FenxiaoSketch } from '@/components/FenxiaoSketch'
import type { CaseRecord } from '@/content/cases'
import { cn } from '@/lib/cn'

/** 朱笔眉批：一条批注，前面一个朱圈 */
function Note({ text, index }: { text: string; index: number }) {
  return (
    <li
      className="kai relative pl-5 text-[14.5px] leading-[1.75] text-cinnabar/90 [text-shadow:0_0_0.4px_rgba(168,50,42,0.6)]"
      style={{ transform: `rotate(${index % 2 === 0 ? -0.6 : 0.5}deg)` }}
    >
      <span aria-hidden className="absolute left-0 top-[0.55em] h-2.5 w-2.5 rounded-full border-[1.5px] border-cinnabar/80" />
      {text}
    </li>
  )
}

export function BookSpread({
  item,
  pageLabel,
  turn,
  showLink = true,
}: {
  item: CaseRecord
  pageLabel: string
  turn?: 'forward' | 'back'
  showLink?: boolean
}) {
  const plate = item.plates[0]
  const notes = item.notes ?? []

  return (
    <article
      key={item.slug}
      className={cn(
        'book overflow-hidden',
        turn === 'forward' && 'page-turn',
        turn === 'back' && 'page-turn-back',
      )}
    >
      {/* 天头：留给朱笔眉批 */}
      {notes.length > 0 ? (
        <aside
          aria-label="驻场眉批"
          className="relative border-b border-dashed border-cinnabar/30 bg-[#f4ead4] px-5 pb-4 pt-5 sm:px-8"
        >
          <p className="kai mb-2 flex items-center gap-2 text-[13px] tracking-[0.3em] text-cinnabar/70">
            <span aria-hidden className="h-px w-6 bg-cinnabar/50" />
            驻场眉批
            <span className="tracking-normal text-ink/40">· 现场踩过的坑，只写过程</span>
          </p>
          <ul className="grid gap-x-10 gap-y-1.5 md:grid-cols-2">
            {notes.map((text, index) => (
              <Note key={text} text={text} index={index} />
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="grid md:grid-cols-[1fr_44px_1fr]">
        <div className="book-rules relative p-5 sm:p-8">
          <div className="flex h-full flex-col">
            {plate ? (
              <figure>
                <div className="border border-ink/30 bg-[#f7efdd] p-2">
                  <img
                    src={plate.src}
                    alt={`${item.industry}系统截图，已打码`}
                    loading="lazy"
                    className="block w-full [filter:sepia(0.28)_saturate(0.7)]"
                  />
                </div>
                <figcaption className="kai mt-3 text-[14px] text-ink/70">
                  {plate.caption}
                </figcaption>
              </figure>
            ) : (
              <FenxiaoSketch />
            )}
          </div>
        </div>

        <div aria-hidden className="book-gutter hidden flex-col items-center py-8 md:flex">
          <span className="kai vertical text-[13px] tracking-[0.3em] text-ink/55">剑来剑谱 · 案例集</span>
        </div>

        <div className="book-rules relative flex gap-6 p-5 sm:p-8">
          <div className="min-w-0 flex-1">
            <p className="kai text-[15px] text-ink/60">{pageLabel}</p>
            <h3 className="brush mt-2 text-[40px] leading-tight sm:text-[48px]">{item.industry}</h3>
            {item.pitch ? <p className="mt-4 text-[17px] leading-[1.8] text-ink/85">{item.pitch}</p> : null}
            {item.stuckAt ? (
              <div className="mt-5">
                <p className="kai text-[15px] text-cinnabar">去之前的问题</p>
                <p className="mt-1 text-[16px] leading-[1.8] text-ink/80">{item.stuckAt}</p>
              </div>
            ) : null}
            {item.built ? (
              <div className="mt-4">
                <p className="kai text-[15px] text-cinnabar">我们做了什么</p>
                <p className="mt-1 text-[16px] leading-[1.8] text-ink/80">{item.built}</p>
              </div>
            ) : null}
            {item.onSite ? (
              <div className="mt-4">
                <p className="kai text-[15px] text-cinnabar">人进去怎么做的</p>
                <p className="mt-1 text-[16px] leading-[1.8] text-ink/80">{item.onSite}</p>
              </div>
            ) : null}
            {item.processWords.length > 0 ? (
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[16px] tracking-[0.1em] text-ink/80">
                {item.processWords.map((word, index) => (
                  <span key={word}>
                    {word}
                    {index < item.processWords.length - 1 ? <span className="ml-4 text-ink/35">·</span> : null}
                  </span>
                ))}
              </p>
            ) : null}
            {showLink ? (
              <Link to="/work/$slug" params={{ slug: item.slug }} className="ink-link mt-6 inline-block text-[16px]">
                看这个项目
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
