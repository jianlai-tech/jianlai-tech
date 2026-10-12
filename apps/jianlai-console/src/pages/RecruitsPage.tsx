import { useCallback, useEffect, useMemo, useState } from 'react'
import { errorText } from '@/lib/api'
import { cn } from '@/lib/cn'
import {
  RECRUIT_STATUSES,
  fetchRecruits,
  updateRecruit,
  type Recruit,
  type RecruitList,
  type RecruitStatus,
} from '@/lib/recruits'
import { Chip, Empty, MetricStrip, PageHead, Segmented, Sheet, Stamp, type Tone } from '@/components/ui'

type Filter = RecruitStatus | 'all'

const STATUS_TONE: Record<RecruitStatus, Tone> = {
  new: 'cinnabar',
  contacted: 'ochre',
  trial: 'ochre',
  joined: 'jade',
  declined: 'plain',
}

const STATUS_LABEL = Object.fromEntries(RECRUIT_STATUSES.map((s) => [s.key, s.label])) as Record<
  RecruitStatus,
  string
>

function fmtWhen(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Detail({ row, onSaved }: { row: Recruit; onSaved: (next: Recruit) => void }) {
  const [note, setNote] = useState(row.admin_note ?? '')
  const [state, setState] = useState({ busy: false, msg: '' })

  async function save(body: { status?: RecruitStatus; admin_note?: string }) {
    setState({ busy: true, msg: '' })
    try {
      const next = await updateRecruit(row.id, body)
      onSaved(next)
      setState({ busy: false, msg: '已存' })
    } catch (err) {
      setState({ busy: false, msg: errorText(err) })
    }
  }

  return (
    <div className="flex flex-col">
      <div className="hair-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="title-serif truncate text-[18px] leading-7">
              {row.name}
              <span className="ml-2 text-[14px] font-normal text-ink3">{row.age} 岁</span>
            </h3>
            <p className="text-[14px] text-ink2">
              {row.major}
              {row.school ? ` · ${row.school}` : ''}
            </p>
          </div>
          {row.status === 'joined' ? <Stamp>已入门</Stamp> : <Chip tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Chip>}
        </div>
      </div>

      <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-3 text-[14px]">
        <dt className="label pt-0.5">AI 经历</dt>
        <dd className="whitespace-pre-wrap leading-6">{row.ai_story}</dd>
        <dt className="label pt-0.5">特长</dt>
        <dd className="whitespace-pre-wrap leading-6">{row.strengths}</dd>
        <dt className="label pt-0.5">手机</dt>
        <dd>
          <a href={`tel:${row.phone}`} className="font-semibold tabular-nums underline decoration-ink/30 underline-offset-4">
            {row.phone}
          </a>
        </dd>
        <dt className="label pt-0.5">微信</dt>
        <dd>{row.wechat ?? <span className="text-ink3">没留</span>}</dd>
        <dt className="label pt-0.5">递帖</dt>
        <dd className="text-ink2">
          {row.source} · {fmtWhen(row.created_at)}
        </dd>
      </dl>

      <div className="hair-t space-y-3 px-4 py-3">
        <div>
          <span className="label">跟进到哪</span>
          <div className="mt-1.5">
            <Segmented
              label="跟进状态"
              value={row.status}
              onChange={(key) => {
                if (key !== row.status) void save({ status: key })
              }}
              options={RECRUIT_STATUSES.map((s) => ({ key: s.key, label: s.label }))}
            />
          </div>
        </div>
        <label className="block">
          <span className="label">道长批注</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="聊过之后的印象、适合哪个门、打算派什么小活试手"
            className="field mt-1 h-auto resize-y py-2 leading-6"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={state.busy || note === (row.admin_note ?? '')}
            onClick={() => void save({ admin_note: note })}
          >
            存批注
          </button>
          {state.msg ? (
            <span className={cn('text-[13px]', state.msg === '已存' ? 'text-jade' : 'text-cinnabar')} role="status">
              {state.msg}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function RecruitsPage() {
  const [data, setData] = useState<RecruitList | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    try {
      setData(await fetchRecruits())
    } catch (err) {
      setError(errorText(err, '没拉到英雄帖'))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const rows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.items.filter(
      (row) =>
        (filter === 'all' || row.status === filter) &&
        (!q ||
          [row.name, row.major, row.school ?? '', row.phone].some((v) => v.toLowerCase().includes(q))),
    )
  }, [data, filter, query])

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0] ?? null

  function onSaved(next: Recruit) {
    setData((prev) => {
      if (!prev) return prev
      const old = prev.items.find((r) => r.id === next.id)
      const counts = { ...prev.counts }
      if (old && old.status !== next.status) {
        counts[old.status] -= 1
        counts[next.status] += 1
      }
      return { ...prev, counts, items: prev.items.map((r) => (r.id === next.id ? next : r)) }
    })
  }

  const counts = data?.counts
  const weekAgo = Date.now() - 7 * 86_400_000
  const thisWeek = data ? data.items.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length : 0

  return (
    <>
      <PageHead
        title="英雄帖"
        note="官网招剑修，递上来的帖子"
        actions={
          <a href="/join" target="_blank" rel="noreferrer" className="btn">
            看官网帖子页
          </a>
        }
      />

      {error ? (
        <Sheet className="mb-4 flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-cinnabar">{error}</span>
          <button type="button" className="btn" onClick={() => void load()}>
            重试
          </button>
        </Sheet>
      ) : null}

      <div className="mb-4">
        <MetricStrip
          items={[
            {
              label: '待看的新帖',
              value: String(counts?.new ?? 0),
              tone: (counts?.new ?? 0) > 0 ? 'cinnabar' : 'ink',
            },
            { label: '近 7 天递帖', value: String(thisWeek) },
            { label: '约聊 / 试手', value: String((counts?.contacted ?? 0) + (counts?.trial ?? 0)) },
            { label: '已入门', value: String(counts?.joined ?? 0), tone: 'jade' },
            { label: '帖子总数', value: String(data?.total ?? 0) },
          ]}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Segmented
          label="按状态筛"
          value={filter}
          onChange={setFilter}
          options={[
            { key: 'all' as Filter, label: `全部 ${data?.total ?? 0}` },
            ...RECRUIT_STATUSES.map((s) => ({ key: s.key as Filter, label: `${s.label} ${counts?.[s.key] ?? 0}` })),
          ]}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜姓名、专业、学校、手机"
          aria-label="搜英雄帖"
          className="field w-full sm:w-64"
        />
      </div>

      <div className="grid items-start gap-4 xl:[grid-template-columns:minmax(0,1fr)_420px]">
        <Sheet className="overflow-hidden">
          {!data && !error ? (
            <div className="px-4 py-8 text-center text-ink3">载入中…</div>
          ) : rows.length === 0 ? (
            <Empty
              title={data?.total ? '这一栏没有帖子' : '还没人揭榜'}
              hint="官网「英雄帖」页面递上来的帖子，会自己落到这里。"
            />
          ) : (
            <div className="max-h-[620px] overflow-auto">
              <table className="ops-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th className="num">年纪</th>
                    <th>专业</th>
                    <th>AI 经历</th>
                    <th>递帖</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      data-row
                      tabIndex={0}
                      aria-selected={selected?.id === row.id}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedId(row.id)
                        }
                      }}
                    >
                      <td>
                        <div className="font-semibold">{row.name}</div>
                        {row.school ? <div className="text-[13px] text-ink3">{row.school}</div> : null}
                      </td>
                      <td className="num">{row.age}</td>
                      <td>{row.major}</td>
                      <td className="max-w-[280px] truncate text-ink2" title={row.ai_story}>
                        {row.ai_story}
                      </td>
                      <td className="whitespace-nowrap text-ink2 tabular-nums">{fmtWhen(row.created_at)}</td>
                      <td>
                        <Chip tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Sheet>

        <Sheet className="xl:sticky xl:top-6">
          {selected ? (
            <Detail key={selected.id} row={selected} onSaved={onSaved} />
          ) : (
            <Empty title="点一行看帖子" hint="约聊、试手、入门，都在这一栏里记。" />
          )}
        </Sheet>
      </div>
    </>
  )
}
