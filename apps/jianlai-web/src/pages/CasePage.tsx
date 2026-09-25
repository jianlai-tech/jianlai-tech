import { Link, useParams } from '@tanstack/react-router'
import { FenxiaoSketch } from '@/components/FenxiaoSketch'
import { Mark } from '@/components/Mark'
import { TapePhoto } from '@/components/TapePhoto'
import { caseBySlug } from '@/content/cases'

export function CasePage() {
  const { slug } = useParams({ strict: false })
  const item = slug ? caseBySlug(slug) : undefined

  if (!item || !item.published) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16">
        <p className="font-doodle">这条案例还没对外。</p>
        <Link to="/work" className="zine-link mt-4 inline-block">
          回案例集
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <Link to="/work" className="zine-link">
        案例集
      </Link>
      <h1 className="mt-3 font-mark text-5xl leading-tight sm:text-6xl">{item.industry}</h1>
      {item.pitch ? (
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink/80">{item.pitch}</p>
      ) : null}
      {item.processWords.length > 0 ? (
        <p className="mt-5 font-doodle text-lg">
          {item.processWords.map((word, index) => (
            <span key={word}>
              <Mark tone={index % 3 === 1 ? 'pink' : index % 3 === 2 ? 'teal' : 'yellow'}>
                {word}
              </Mark>
              {index < item.processWords.length - 1 ? ' → ' : ''}
            </span>
          ))}
        </p>
      ) : null}

      {item.plates.length > 0 ? (
        <section className="mt-10 space-y-10">
          {item.plates.map((plate, index) => (
            <TapePhoto
              key={plate.src}
              src={plate.src}
              alt={`${item.industry}脱敏截图`}
              caption={plate.caption}
              tilt={index % 2 === 0 ? 'left' : 'right'}
            />
          ))}
        </section>
      ) : (
        <section className="mt-10">
          <FenxiaoSketch />
        </section>
      )}

      {item.stuckAt ? (
        <section className="mt-12 max-w-prose">
          <h2 className="font-mark text-3xl">进场时卡在哪</h2>
          <p className="mt-3 leading-relaxed text-ink/80">{item.stuckAt}</p>
        </section>
      ) : null}
      {item.built ? (
        <section className="mt-8 max-w-prose">
          <h2 className="font-mark text-3xl">做成了什么</h2>
          <p className="mt-3 leading-relaxed text-ink/80">{item.built}</p>
        </section>
      ) : null}
      {item.whoUses ? (
        <p className="mt-6 font-doodle text-ink/65">谁在用：{item.whoUses}</p>
      ) : null}

      <Link to="/start" className="zine-cta mt-10 inline-flex no-underline">
        留个联系方式
      </Link>
    </main>
  )
}
