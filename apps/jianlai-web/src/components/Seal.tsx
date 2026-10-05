import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * 白文印：朱砂底，字是刻掉的纸色。
 * 四字按“右列先下、再左列”排（剑来 / 科技），两三字竖排成一列，一字是小方印。
 * 边是手刻的毛边，印面有几处磨掉的小坑，用 SVG 滤镜做，不用图片。
 */
export function Seal({
  className,
  size = 62,
  chars = '剑来科技',
  title,
}: {
  className?: string
  /** 印面宽度（px）。两字、三字竖印的高度随字数拉长 */
  size?: number
  chars?: string
  title?: string
}) {
  const id = useId().replace(/:/g, '')
  const glyphs = Array.from(chars)
  const n = glyphs.length
  const single = n === 1
  const tall = n === 2 || n === 3
  const w = single ? 60 : tall ? 60 : 100
  const h = single ? 60 : tall ? 14 + n * 44 : 100

  const cells: { ch: string; x: number; y: number; fs: number }[] = single
    ? [{ ch: glyphs[0], x: 30, y: 30, fs: 40 }]
    : tall
    ? glyphs.map((ch, i) => ({ ch, x: w / 2, y: 28 + i * 44, fs: 38 }))
    : glyphs.map((ch, i) => {
        const col = Math.floor(i / 2)
        const row = i % 2
        return { ch, x: 73 - col * 46, y: 31 + row * 42, fs: 38 }
      })

  return (
    <svg
      className={cn('inline-block shrink-0', className)}
      width={size}
      height={size * (h / w)}
      viewBox={`0 0 ${w} ${h}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <filter id={`carve-${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="11" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  14 0 0 0 -4.6"
            result="wear"
          />
          <feComposite in="rough" in2="wear" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#carve-${id})`}>
        <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="3" fill="#a8322a" />
        <rect
          x="6"
          y="6"
          width={w - 12}
          height={h - 12}
          rx="1.5"
          fill="none"
          stroke="#f1e6cf"
          strokeWidth="1.6"
        />
        {cells.map((cell) => (
          <text
            key={`${cell.ch}-${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            fontSize={cell.fs}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#f1e6cf"
            stroke="#f1e6cf"
            strokeWidth="0.9"
            style={{ fontFamily: "'Zhi Mang Xing', 'STXingkai', cursive" }}
          >
            {cell.ch}
          </text>
        ))}
      </g>
    </svg>
  )
}
