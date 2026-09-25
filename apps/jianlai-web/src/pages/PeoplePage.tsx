import { Link } from '@tanstack/react-router'
import { Mark } from '@/components/Mark'
import { publicStaff } from '@/content/studio'

const ROLE_LABEL = {
  principal: '主理人',
  fde: '驻场',
} as const

export function PeoplePage() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <h1 className="font-mark text-6xl leading-none">人</h1>
      <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink/80">
        工作室像建筑事务所：<Mark>主理人接现场</Mark>，驻场的人按档位进组。每人有简历和擅长。
      </p>
      <ul className="mt-10 space-y-8">
        {publicStaff().map((person) => (
          <li
            key={person.slug}
            className="relative max-w-md -rotate-1 border border-ink/15 bg-white/50 px-5 py-5"
          >
            <span className="zine-tape -top-2 right-8 rotate-12" />
            <p className="font-doodle text-lake">{ROLE_LABEL[person.role]}</p>
            <h2 className="mt-1 font-mark text-4xl leading-none">{person.name}</h2>
            <p className="mt-3 font-doodle text-base">{person.specialty}</p>
            <p className="mt-2 leading-relaxed text-ink/80">{person.bio}</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 max-w-sm rotate-1 font-doodle text-ink/55">
        驻场名册还在收。
      </p>
      <Link to="/start" className="zine-cta mt-8 inline-flex no-underline">
        留个联系方式
      </Link>
    </main>
  )
}
