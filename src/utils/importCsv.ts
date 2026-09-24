export type ImportRow = {
  title: string
  year: string
  movieId: string
  rating: number | null
  watchedDate: string | null
}
export function parseLibraryCsv(text: string): ImportRow[] {
  if (text.length > 2_000_000)
    throw new Error('Choose a CSV smaller than 2 MB.')
  const records: string[][] = []
  let row: string[] = [],
    cell = '',
    quoted = false,
    closed = false
  const push = () => {
    row.push(cell.trim())
    cell = ''
    closed = false
  }
  const source = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < source.length; i++) {
    const c = source[i]!
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') {
        quoted = false
        closed = true
      } else cell += c
    } else if (c === ',') push()
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && source[i + 1] === '\n') i++
      push()
      records.push(row)
      row = []
    } else if (c === '"' && !cell && !closed) quoted = true
    else if (closed || c === '"')
      throw new Error(
        'Malformed CSV quotes. Export the file as CSV and try again.'
      )
    else cell += c
  }
  if (quoted) throw new Error('The CSV has an unclosed quote.')
  push()
  records.push(row)
  const filled = records.filter((r) => r.some(Boolean))
  const headers =
    filled.shift()?.map((h) => h.toLowerCase().replace(/[ _-]/g, '')) || []
  const titleColumn = headers.findIndex((h) => h === 'title' || h === 'name')
  if (titleColumn < 0) throw new Error('A Title or Name column is required.')
  if (!filled.length || filled.length > 500)
    throw new Error('Import between 1 and 500 films at a time.')
  return filled.map((r, i) => {
    const get = (key: string) => r[headers.indexOf(key)] || ''
    const fail = (message: string): never => {
      throw new Error(`Row ${i + 2}: ${message}`)
    }
    if (r.length !== headers.length)
      fail('the number of columns does not match the header.')
    const title = r[titleColumn] || ''
    if (!title) fail('a title is required.')
    const year = get('year'),
      movieId = get('tmdbid')
    if (year && !/^\d{4}$/.test(year)) fail('use a four-digit year.')
    if (movieId && !/^[1-9]\d*$/.test(movieId))
      fail('TMDB ID must be a positive number.')
    const raw = get('rating10') || get('rating')
    const rating = raw ? Number(raw) / (get('rating10') ? 2 : 1) : null
    if (
      rating !== null &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    )
      fail(
        'this app supports whole-star ratings from 1 to 5. Adjust or clear this rating before importing.'
      )
    const watchedDate = get('watcheddate') || null
    if (
      watchedDate &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(watchedDate) ||
        !Number.isFinite(Date.parse(watchedDate)) ||
        new Date(watchedDate).toISOString().slice(0, 10) !== watchedDate ||
        watchedDate > new Date().toISOString().slice(0, 10))
    )
      fail('use a valid, non-future watched date (YYYY-MM-DD).')
    return { title, year, movieId, rating, watchedDate }
  })
}
