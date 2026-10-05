export function fillMonths(
  start: string,
  end: string,
  items: { month: string; income: number; expenses: number }[],
) {
  const result: typeof items = []
  const cursor = new Date(`${start.slice(0, 7)}-01T12:00:00`)
  const last = new Date(`${end.slice(0, 7)}-01T12:00:00`)
  while (cursor <= last) {
    const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
    result.push(
      items.find((v) => v.month === month) || { month, income: 0, expenses: 0 },
    )
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return result
}
