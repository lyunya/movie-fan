import { describe, expect, it } from 'vitest'
import { parseLibraryCsv } from './importCsv'
import { comparePair } from './comparison'
describe('portable CSV import', () => {
  it('reads BOM, quoted commas, escaped quotes, embedded newlines and CRLF', () => {
    expect(
      parseLibraryCsv(
        '\uFEFFTitle,Year,Rating10,WatchedDate,tmdbID\r\n"A, ""film""\npart two",2020,8,2020-02-29,12'
      )[0]
    ).toEqual({
      title: 'A, "film"\npart two',
      year: '2020',
      rating: 4,
      watchedDate: '2020-02-29',
      movieId: '12',
    })
  })
  it('accepts Letterboxd names and unknown dates', () => {
    expect(
      parseLibraryCsv('Name,Year,Rating,Watched Date\nArrival,2016,5,')[0]
    ).toMatchObject({
      title: 'Arrival',
      rating: 5,
      watchedDate: null,
      movieId: '',
    })
  })
  it.each([
    'Title,Rating\nFilm,3.5',
    'Title,WatchedDate\nFilm,2023-02-29',
    'Title,tmdbID\nFilm,-2',
    'Title,Year\nFilm,2020,extra',
    'Title\n"Unfinished',
    'Title\n"Film"oops',
    'Title,WatchedDate\nFilm,2099-01-01',
  ])('rejects invalid input without silent data loss: %s', (csv) =>
    expect(() => parseLibraryCsv(csv)).toThrow()
  )
  it('bounds the import and requires a title column', () => {
    expect(() => parseLibraryCsv('Other\nFilm')).toThrow('Title')
    expect(() => parseLibraryCsv('Title\n' + 'Film\n'.repeat(501))).toThrow(
      '500'
    )
  })
})
describe('comparison tune-up', () => {
  it('reorders just the chosen pair without changing or dropping other films', () => {
    const ids = ['a', 'b', 'c', 'd']
    expect(comparePair(ids, 1, 'right')).toEqual(['a', 'c', 'b', 'd'])
    expect(ids).toEqual(['a', 'b', 'c', 'd'])
    for (const choice of ['left', 'tie', 'skip'] as const)
      expect(comparePair(ids, 1, choice)).toEqual(ids)
  })
})
