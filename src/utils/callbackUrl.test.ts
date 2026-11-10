import { describe, expect, it } from 'vitest'
import { safeCallbackUrl } from './callbackUrl'

const site = 'https://moviefan.example'
const safe = (value?: string | string[]) => safeCallbackUrl(value, site)

describe('safeCallbackUrl', () => {
  it('keeps paths on this site', () => {
    expect(safe('/movie/550')).toBe('/movie/550')
    expect(safe('/library?tab=watched#top')).toBe('/library?tab=watched#top')
    expect(safe(['/diary', '/other'])).toBe('/diary')
  })

  it('reduces a same-origin URL to its path', () => {
    expect(safe('https://moviefan.example/lists?x=1')).toBe('/lists?x=1')
  })

  it('refuses anything a browser could read as another host', () => {
    for (const bad of [
      '//evil.example',
      '/\\evil.example',
      '\\\\evil.example',
      '/\t/evil.example',
      'https://evil.example/',
      'https://moviefan.example.evil.example/',
      'javascript:alert(1)',
    ])
      expect(safe(bad), bad).toBe('/')
  })

  it('goes home when there is nothing to go back to', () => {
    expect(safe(undefined)).toBe('/')
    expect(safe('')).toBe('/')
  })
})
