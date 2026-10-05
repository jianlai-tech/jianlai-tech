import { cn } from '@/lib/cn'

/** 点缀用的水墨素材：只做装饰，不参与布局，读屏跳过 */

export function InkMountains({ className }: { className?: string }) {
  return (
    <img
      src="/art/yuanshan.webp"
      alt=""
      aria-hidden
      width={960}
      height={242}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('ink-mountains pointer-events-none select-none', className)}
    />
  )
}

export function InkRiver({ className }: { className?: string }) {
  return (
    <img
      src="/art/jiangzhou.webp"
      alt=""
      aria-hidden
      width={1200}
      height={257}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('ink-river pointer-events-none select-none', className)}
    />
  )
}

export function InkCliff({ className }: { className?: string }) {
  return (
    <img
      src="/art/fengqi.webp"
      alt=""
      aria-hidden
      width={900}
      height={679}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('ink-cliff pointer-events-none select-none', className)}
    />
  )
}

export function PineBranch({ className }: { className?: string }) {
  return (
    <img
      src="/art/songzhi.webp"
      alt=""
      aria-hidden
      width={420}
      height={311}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('pointer-events-none select-none', className)}
    />
  )
}

export function SwordTassel({ className }: { className?: string }) {
  return (
    <img
      src="/art/jiansui.webp"
      alt=""
      aria-hidden
      width={75}
      height={360}
      decoding="async"
      draggable={false}
      className={cn('pointer-events-none w-auto select-none', className)}
    />
  )
}
