const DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** 1–99 写成中文数字：卷十一、卷二十 */
export function cnNum(n: number) {
  if (n < 10) return DIGITS[n]
  const tens = Math.floor(n / 10)
  const ones = n % 10
  return `${tens === 1 ? '' : DIGITS[tens]}十${ones ? DIGITS[ones] : ''}`
}
