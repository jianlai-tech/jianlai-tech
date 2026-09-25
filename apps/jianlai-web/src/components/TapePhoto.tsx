import { cn } from '@/lib/cn'

export function TapePhoto({
  src,
  alt,
  caption,
  tilt = 'left',
  className,
}: {
  src: string
  alt: string
  caption?: string
  tilt?: 'left' | 'right' | 'none'
  className?: string
}) {
  const rotate =
    tilt === 'left' ? '-rotate-[1.6deg]' : tilt === 'right' ? 'rotate-[1.8deg]' : ''

  return (
    <figure className={cn('relative', className)}>
      <div className={cn('zine-photo', rotate)}>
        <span className="zine-tape -top-2 left-8 -rotate-[8deg]" />
        <span className="zine-tape -top-1.5 right-10 rotate-[11deg]" />
        <img src={src} alt={alt} className="block w-full bg-slate-50" />
      </div>
      {caption ? (
        <figcaption className="zine-caption">
          {caption}
          <span className="ml-2 text-ink/45">示意 · 已脱敏</span>
        </figcaption>
      ) : null}
    </figure>
  )
}
