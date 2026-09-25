import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type MarkTone = 'yellow' | 'pink' | 'teal'

export function Mark({
  tone = 'yellow',
  children,
}: {
  tone?: MarkTone
  children: ReactNode
}) {
  return <span className={cn('zine-mark', `zine-mark-${tone}`)}>{children}</span>
}
