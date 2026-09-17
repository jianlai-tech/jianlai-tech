import { Link } from '@tanstack/react-router'

export function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="text-sm text-neutral-500">见来</p>
      <h1 className="mt-2 text-2xl font-semibold">派人驻进公司，把日常经营做成能跑的系统。</h1>
      <p className="mt-4 text-neutral-600">
        做过 K12 一对一家教、医疗器械批发分销、管材贸易三类现场。不卖标准软件，不交一叠方案。
      </p>
      <Link
        to="/start"
        className="mt-8 inline-block rounded bg-neutral-900 px-4 py-2 text-sm text-white"
      >
        留个联系方式
      </Link>
    </main>
  )
}
