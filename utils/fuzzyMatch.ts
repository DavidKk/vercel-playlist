export function fuzzyMatch(pattern: string, name: string) {
  if (!(typeof pattern === 'string' && typeof name === 'string')) {
    console.warn(`fuzzyMatch: pattern or name is empty`)
    return 0
  }

  const p = pattern.toLowerCase()
  const n = name.toLowerCase()

  if (pattern === name || p === n) {
    return 1
  }

  if (!(name.length > 0 && pattern.length > 0)) {
    return 0
  }

  if (name.includes(pattern) || p.includes(n)) {
    return 2
  }

  const normalize = (text: string) => {
    const content = text.toLowerCase().replace(/[\s_\-]+/g, '(?:\\s*?)')
    return new RegExp(`^${content}(?!\\d)`, 'im')
  }

  const normalizedPattern = normalize(pattern)
  if (normalizedPattern.test(name)) {
    return 3
  }

  return 0
}
