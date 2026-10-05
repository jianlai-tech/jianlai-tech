import { Link, useParams } from '@tanstack/react-router'
import { BookSpread } from '@/components/BookSpread'
import { CaseBook } from '@/components/CaseBook'
import { caseBySlug, publishedCases } from '@/content/cases'
import { cnNum } from '@/lib/numerals'

export function CasePage() {
  const { slug } = useParams({ strict: false })
  const item = slug ? caseBySlug(slug) : undefined
  const cases = publishedCases()
  const index = item ? cases.findIndex((entry) => entry.slug === item.slug) : -1

  if (!item || !item.published) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="text-[18px]">这个项目还没公开。</p>
        <Link to="/work" className="ink-link mt-4 inline-block">
          回到案例集
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1280px] px-5 pb-10 sm:px-[54px]">
      <Link to="/work" className="ink-link mt-8 inline-block text-[16px]">
        ← 案例集
      </Link>
      <div className="mt-6">
        {item.chapters?.length ? (
          <CaseBook item={item} vol={Math.max(index, 0) + 1} />
        ) : (
          <BookSpread
            item={item}
            showLink={false}
            pageLabel={`卷${cnNum(Math.max(index, 0) + 1)} · 共 ${cases.length} 册`}
          />
        )}
      </div>

      {item.plates.length > 1 && !item.chapters?.length ? (
        <section className="mt-14" aria-labelledby="plates-title">
          <h2 id="plates-title" className="brush text-[40px] leading-none">
            系统里的几页
          </h2>
          <div className="mt-8 grid gap-10 md:grid-cols-2">
            {item.plates.slice(1).map((plate) => (
              <figure key={plate.src}>
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
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
