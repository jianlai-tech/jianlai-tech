import { useAuth } from '@/data/auth'
import { Chip, Empty, PageHead, SectionHead, Sheet } from '@/components/ui'
import { ProgressBar, stageTone } from '@/pages/MePage'
import { STAGES } from '@/lib/account'
import { cn } from '@/lib/cn'

/** 合作企业看到的：自己公司的项目进度和驻场的人，别的一律看不到 */
export function ClientHomePage() {
  const { me } = useAuth()
  if (!me) return null
  const projects = me.projects ?? []

  return (
    <>
      <PageHead title={me.account.company ?? '我的项目'} note={`对接人 ${me.account.name}`} />
      {projects.length === 0 ? (
        <Sheet>
          <Empty title="项目还在准备" hint="主理人建好项目后，进度和驻场的人会出现在这里。" />
        </Sheet>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => {
            const at = STAGES.indexOf(p.stage)
            return (
              <Sheet key={p.id}>
                <SectionHead
                  title={p.name}
                  hint={p.industry ?? undefined}
                  aside={
                    <>
                      <Chip tone={stageTone(p.stage)}>{p.stage}</Chip>
                      <ProgressBar value={p.progress} />
                    </>
                  }
                />
                <div className="space-y-4 px-4 py-4">
                  <ol className="grid grid-cols-5 gap-px overflow-hidden rounded-sm border border-ink/15 bg-ink/10 text-center text-[13px]">
                    {STAGES.map((stage, index) => (
                      <li
                        key={stage}
                        className={cn(
                          'px-1 py-2',
                          index < at && 'bg-sheet2 text-ink2',
                          index === at && 'bg-rail font-semibold text-paper',
                          index > at && 'bg-sheet text-ink3',
                        )}
                      >
                        {stage}
                      </li>
                    ))}
                  </ol>
                  {p.progress_note ? <p className="text-[14px] text-ink2">{p.progress_note}</p> : null}
                  <div>
                    <span className="label">驻场的人</span>
                    <p className="mt-1 text-[14px]">
                      {p.members && p.members.length
                        ? p.members.map((m) => `${m.name}（${m.role}）`).join('、')
                        : '还在安排'}
                    </p>
                  </div>
                  <p className="text-[12px] text-ink3">
                    {p.started_on ? `开始于 ${p.started_on}` : ''}
                    {p.ended_on ? ` · 结束于 ${p.ended_on}` : ''}
                  </p>
                </div>
              </Sheet>
            )
          })}
        </div>
      )}
    </>
  )
}
