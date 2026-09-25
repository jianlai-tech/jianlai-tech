export function FenxiaoSketch() {
  return (
    <figure className="relative">
      <div className="zine-photo rotate-[0.8deg] px-5 py-6">
        <span className="zine-tape -top-2 left-10 -rotate-6" />
        <p className="font-doodle text-sm text-ink/60">货仓账 · 现场工序草图</p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="-rotate-1 border border-dashed border-ink/40 px-4 py-5">
            <p className="font-mark text-3xl leading-none">货</p>
            <p className="mt-2 font-doodle text-sm text-ink/70">主数据先对齐</p>
          </div>
          <div className="rotate-1 flex-1 bg-mark/50 px-5 py-7">
            <p className="font-mark text-4xl leading-none">仓</p>
            <p className="mt-2 font-doodle text-sm text-ink/70">进出要落同一本</p>
          </div>
          <div className="-rotate-[0.8deg] w-[9.5rem] bg-blush/25 px-4 py-4">
            <p className="font-mark text-2xl leading-none">账</p>
            <p className="mt-2 font-doodle text-sm text-ink/70">对得上才算</p>
          </div>
        </div>
      </div>
      <figcaption className="zine-caption">
        分销系统实拍还在脱敏，先把工序钉在纸上。
      </figcaption>
    </figure>
  )
}
