import { ImageResponse } from 'next/og'

// Static share card for the Frame Game (built once; no runtime cost).
export const alt = 'The Frame Game — name the film from a single frame'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const TILES = [
  '#f5c451',
  '#f5c451',
  '#fb923c',
  '#ec4899',
  '#f5c451',
  '#52525b',
  '#f5c451',
  '#fb923c',
  '#f5c451',
  '#ec4899',
]

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 96px',
        background: 'linear-gradient(135deg, #111013 0%, #231d25 100%)',
        color: '#f5f2ef',
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 10, color: '#f5c451' }}>
        MOVIE FAN · DAILY GAME
      </div>
      <div style={{ fontSize: 120, fontWeight: 700, lineHeight: 1.05 }}>
        The Frame Game
      </div>
      <div style={{ fontSize: 40, color: '#d4d4d8', marginTop: 16 }}>
        Name the film from a single, out-of-focus frame.
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 48,
          padding: '22px 22px',
          background: '#000',
          borderRadius: 16,
        }}
      >
        {TILES.map((c, i) => (
          <div
            key={i}
            style={{ width: 82, height: 46, borderRadius: 6, background: c }}
          />
        ))}
      </div>
    </div>,
    size
  )
}
