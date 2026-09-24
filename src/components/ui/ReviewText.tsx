'use client'
import { useState } from 'react'
export default function ReviewText({
  text,
  spoiler,
}: {
  text: string
  spoiler: boolean
}) {
  const [show, setShow] = useState(!spoiler)
  return show ? (
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
      {text}
    </p>
  ) : (
    <button
      className="btn-ghost mt-3 !py-2 !text-sm"
      onClick={() => setShow(true)}
    >
      Reveal spoiler review
    </button>
  )
}
