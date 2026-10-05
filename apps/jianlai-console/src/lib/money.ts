export function yuan(value: number) {
  return `¥${Math.abs(value).toLocaleString('zh-CN')}`
}

/** 带符号的金额：收入 +，支出 −（真正的减号，对齐数字宽度） */
export function signedYuan(value: number) {
  if (value === 0) return yuan(0)
  return `${value > 0 ? '+' : '−'}${yuan(value)}`
}
