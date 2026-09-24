'use client'
import { useState } from 'react'
import Image from 'next/image'
import Dialog from './Dialog'
import { notify } from './Feedback'
export default function RecapImage({
  year,
  count,
  unique,
  hours,
  titles,
}: {
  year: number
  count: number
  unique: number
  hours: number
  titles: string[]
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [includeCounts, setIncludeCounts] = useState(true)
  const create = () => {
    const c = document.createElement('canvas')
    c.width = 1080
    c.height = 1350
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#111013'
    ctx.fillRect(0, 0, 1080, 1350)
    ctx.fillStyle = '#f9a8d4'
    ctx.font = 'bold 30px sans-serif'
    ctx.fillText('MOVIE FAN PRESENTS', 80, 100)
    ctx.fillStyle = '#f5f2ef'
    ctx.font = 'bold 150px sans-serif'
    ctx.fillText(String(year), 80, 290)
    ctx.font = '42px sans-serif'
    ctx.fillText('My year in frames', 80, 370)
    ctx.fillStyle = '#f9a8d4'
    ctx.fillRect(80, 430, 920, 3)
    ctx.font = 'bold 65px sans-serif'
    if (includeCounts) {
      ctx.fillText(`${count} ${count === 1 ? 'watch' : 'watches'}`, 80, 560)
      ctx.fillText(
        `${unique} different ${unique === 1 ? 'film' : 'films'}`,
        80,
        650
      )
      ctx.fillText(
        `${hours} ${hours === 1 ? 'hour' : 'hours'} of cinema`,
        80,
        740
      )
    } else {
      ctx.font = 'bold 58px sans-serif'
      ctx.fillText('A year of good stories.', 80, 600)
    }
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '24px sans-serif'
    ctx.fillText('A FEW FILMS THAT MADE MY YEAR', 80, 850)
    ctx.fillStyle = '#f5f2ef'
    ctx.font = '34px sans-serif'
    selected.slice(0, 5).forEach((t, i) => {
      let text = t
      while (ctx.measureText(text).width > 900) text = text.slice(0, -2)
      ctx.fillText(text === t ? t : `${text}…`, 80, 920 + i * 60)
    })
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '22px sans-serif'
    ctx.fillText('Collected by me. Remembered with Movie Fan.', 80, 1270)
    setPreview(c.toDataURL('image/png'))
  }
  return (
    <>
      <button
        className="btn-ghost"
        onClick={() => {
          setSelected(titles.slice(0, 5))
          setPreview(null)
          setOpen(true)
        }}
      >
        Create recap image
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Your year, ready to keep"
      >
        {!preview && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Choose up to five films to include. Reviews and private notes stay
              private.
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeCounts}
                onChange={(e) => setIncludeCounts(e.target.checked)}
              />
              Include watch counts and hours
            </label>
            <div className="max-h-64 space-y-2 overflow-auto">
              {titles.map((title) => (
                <label
                  className="flex min-h-11 items-center gap-3 text-sm"
                  key={title}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(title)}
                    disabled={!selected.includes(title) && selected.length >= 5}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, title]
                          : current.filter((t) => t !== title)
                      )
                    }
                  />
                  {title}
                </label>
              ))}
            </div>
            <button className="btn-brand" onClick={create}>
              Preview my image
            </button>
          </div>
        )}
        {preview && (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              Only the details you selected appear. Reviews and private notes
              are never included.
            </p>
            <Image
              src={preview}
              width={540}
              height={675}
              unoptimized
              alt={`Preview of your ${year} movie recap`}
              className="w-full rounded-lg"
            />
            <a
              className="btn-brand mt-5"
              href={preview}
              download={`my-${year}-in-movies.png`}
              onClick={() => notify('Your recap image is ready')}
            >
              Download image
            </a>
            <button
              className="btn-ghost ml-2 mt-5"
              onClick={() => setPreview(null)}
            >
              Edit selection
            </button>
          </>
        )}
      </Dialog>
    </>
  )
}
