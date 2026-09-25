import { ImageResponse } from 'next/og'

// Rendered once at build time (no params), so link previews cost nothing.
export const alt = 'Movie Fan — your own little film club'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
        background:
          'radial-gradient(circle at 85% 20%, #9d174d 0%, #3d0d22 35%, #111013 70%)',
        color: '#f5f2ef',
      }}
    >
      <div style={{ display: 'flex', gap: 14, marginBottom: 36 }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 14,
              background: '#f5c451',
              opacity: i % 2 ? 0.45 : 1,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 30,
          letterSpacing: 10,
          textTransform: 'uppercase',
          color: '#f9a8d4',
        }}
      >
        Your own little film club
      </div>
      <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1.05 }}>
        Movie Fan
      </div>
      <div style={{ fontSize: 40, color: '#d4d4d8', marginTop: 20 }}>
        Find your next favorite. Make a night of it.
      </div>
    </div>,
    size
  )
}
