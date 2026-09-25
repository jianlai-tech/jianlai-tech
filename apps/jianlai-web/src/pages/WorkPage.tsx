import { Link } from '@tanstack/react-router'
import { FenxiaoSketch } from '@/components/FenxiaoSketch'
import { Mark } from '@/components/Mark'
import { TapePhoto } from '@/components/TapePhoto'
import { caseBySlug } from '@/content/cases'

export function WorkPage() {
  const jiajiao = caseBySlug('k12-jiajiao')
  const fenxiao = caseBySlug('yiliao-fenxiao')

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <h1 className="font-mark text-6xl leading-none">案例集</h1>
      <p className="mt-4 max-w-prose text-lg text-ink/80">
        按现场收录。只写行业，不写客户名。图是做过的系统，<Mark>示意 · 已脱敏</Mark>。
      </p>

      {jiajiao ? (
        <article className="mt-14">
          <div className="grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="lg:sticky lg:top-8">
              <h2 className="font-mark text-4xl leading-tight">
                <Link
                  to="/work/$slug"
                  params={{ slug: jiajiao.slug }}
                  className="no-underline"
                >
                  {jiajiao.industry}
                </Link>
              </h2>
              <p className="mt-4 max-w-prose leading-relaxed text-ink/80">{jiajiao.pitch}</p>
              <p className="mt-4 font-doodle text-base">
                {jiajiao.processWords.map((word, index) => (
                  <span key={word}>
                    <Mark tone={index % 2 === 0 ? 'yellow' : 'teal'}>{word}</Mark>
                    {index < jiajiao.processWords.length - 1 ? ' → ' : ''}
                  </span>
                ))}
              </p>
              <Link
                to="/work/$slug"
                params={{ slug: jiajiao.slug }}
                className="zine-link mt-6 inline-block"
              >
                看这一本
              </Link>
            </div>
            <div className="space-y-8">
              <TapePhoto
                src="/cases/jiajiao-lessons.png"
                alt="家教课酬审核脱敏截图"
                caption="课酬审核。待审是空的，栏还在。"
                tilt="right"
              />
              <TapePhoto
                src="/cases/jiajiao-deals.png"
                alt="家教成交台脱敏截图"
                caption="成交台。金额是零，列是真做出来的。"
                tilt="left"
              />
            </div>
          </div>
        </article>
      ) : null}

      {fenxiao ? (
        <article className="mt-20 border-t border-dashed border-ink/20 pt-12">
          <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <FenxiaoSketch />
            <div>
              <h2 className="font-mark text-4xl leading-tight">
                <Link
                  to="/work/$slug"
                  params={{ slug: fenxiao.slug }}
                  className="no-underline"
                >
                  {fenxiao.industry}
                </Link>
              </h2>
              <p className="mt-4 max-w-prose leading-relaxed text-ink/80">{fenxiao.pitch}</p>
              <p className="mt-4 zine-note">
                后台里有真数字的日报，不能贴出来。等糊干净再补实拍。
              </p>
              <Link
                to="/work/$slug"
                params={{ slug: fenxiao.slug }}
                className="zine-link mt-6 inline-block"
              >
                看这一本
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      <p className="mt-16 max-w-md -rotate-1 font-doodle text-base text-ink/60">
        管材贸易现场做过。故事还没收进册子。
      </p>
    </main>
  )
}
