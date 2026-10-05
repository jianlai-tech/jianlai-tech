const STEPS = [
  { glyph: '货', line: '货品资料统一成一份' },
  { glyph: '仓', line: '进货出货记在一处' },
  { glyph: '账', line: '每一笔账都能对上' },
]

export function FenxiaoSketch() {
  return (
    <figure className="flex h-full flex-col justify-center">
      <ol className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-0">
        {STEPS.map((step, index) => (
          <li key={step.glyph} className="flex flex-1 items-center sm:flex-col sm:items-stretch">
            <div className="flex flex-1 flex-col items-center border border-ink/40 px-4 py-6 text-center">
              <span className="brush text-[56px] leading-none">{step.glyph}</span>
              <span className="kai mt-3 text-[15px] text-ink/75">{step.line}</span>
            </div>
            {index < STEPS.length - 1 ? (
              <span aria-hidden className="hidden px-3 text-center text-[22px] text-ink/45 sm:block sm:py-0">
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
      <figcaption className="kai mt-5 text-[14px] text-ink/60">
        这家后台都是真实数字，暂时不放截图，先画一张流程图。
      </figcaption>
    </figure>
  )
}
