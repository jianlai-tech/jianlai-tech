
type Row = { aspect: string; old: string; ours: string }

const ROWS: Row[] = [
  {
    aspect: '需求从哪来',
    old: '开会写需求文档，照文档开发。说出来的要求就是需求。',
    ours: '由最专业的驻场来摸排：跟着你的人走一遍真实的单，把卡在哪看出来，再定先做什么。',
  },
  {
    aspect: '在哪干活',
    old: '后方远程开发，开评审会时才见面。',
    ours: '人驻进你公司，坐在用系统的人旁边做。',
  },
  {
    aspect: '怎么推进',
    old: '一次立项、整体设计，开发几个月后一次性交付。',
    ours: '先斩最急的一处，做最小改动的 MVP，一个月内交付。剑修驻场后，后续迭代更快，一处跑通再下一处。',
  },
  {
    aspect: '交付的是什么',
    old: '按文档交齐功能，验收签字。',
    ours: '三样：一套按你们业务个性化定制的系统，嵌在里面的智能体，和公司内部真正用得起来的人。系统和智能体是手段，要的是指标变好。',
  },
  {
    aspect: '对结果负责',
    old: '对功能负责，功能做齐就算完。业务有没有变好，是客户自己的事。',
    ours: '对业务指标负责：立项时先约定看哪几个数。成本降了、效率升了，或者多接了一块新业务、把原有的服务做深了，指标动了才算做成。不以裁人为目标。',
  },
  {
    aspect: '改需求',
    old: '变更要走流程、重新报价、排期。',
    ours: '线下人就在现场，当场沟通、当场弄清问题、当场改；线上响应在一小时以内。超出约定范围的先记下，商量后再排。',
  },
  {
    aspect: '上线以后',
    old: '培训一次，之后按年付维保。',
    ours: '上线头一段时间人不走，问题当场接住；带出你们自己会用、会查、会改的人。',
  },
  {
    aspect: '价格',
    old: '按人天报价，资深工程师团队的人力成本。',
    ours: '同样的活，报价比传统软件公司低三到五成。省在大学生加 AI 的人力结构，不是少做事。',
  },
  {
    aspect: '怎么付款',
    old: '签约先付大头，验收付尾款，中途见不到能用的东西。',
    ours: '按阶段付：每一处做出来、你的人用上了，再付这一段。',
  },
]

export function ComparisonTable() {
  return (
    <div className="guji-leaf guji-frame relative px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h2 id="compare-title" className="title-swash brush text-[40px] leading-none sm:text-[56px]">
          同一件事，两种做法
        </h2>
        <p className="kai max-w-[22em] text-[15px] leading-[1.8] text-ink/60">
          驻场在业内叫 FDE（前沿部署工程师）：人进现场，对业务结果负责。
        </p>
      </div>

      <div className="mt-8 hidden border-y-2 border-ink md:grid md:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1.15fr)]">
        <span />
        <p className="kai px-6 py-3 text-[16px] tracking-[0.15em] text-ink/55">传统软件开发</p>
        <p className="flex items-center gap-2 border-l border-ink/25 bg-ink/[0.035] px-6 py-3">
          <span className="brush text-[24px] leading-none">剑来驻场</span>
        </p>
      </div>

      <dl className="mt-6 border-t-2 border-ink md:mt-0 md:border-t-0">
        {ROWS.map((row) => (
          <div
            key={row.aspect}
            className="grid border-b border-ink/20 py-4 md:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1.15fr)] md:py-0"
          >
            <dt className="kai text-[17px] text-cinnabar md:py-4 md:text-ink/75">{row.aspect}</dt>
            <dd className="mt-2 text-[15px] leading-[1.75] text-ink/50 md:mt-0 md:px-6 md:py-4">
              <span className="kai mr-2 text-ink/40 md:hidden">传统</span>
              {row.old}
            </dd>
            <dd className="mt-1.5 text-[16px] leading-[1.75] text-ink md:mt-0 md:border-l md:border-ink/25 md:bg-ink/[0.035] md:px-6 md:py-4">
              <span className="brush mr-2 text-[18px] text-cinnabar md:hidden">剑来</span>
              {row.ours}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
