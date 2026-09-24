'use client'
import { useState } from 'react'
import Image from 'next/image'
import Dialog from './Dialog'
import { api } from '@/utils/api'
import { notify } from './Feedback'
import { comparePair } from '@/utils/comparison'

type Film = { id: string; name: string; posterImage: string | null }
export default function ComparisonSession({
  list,
  onClose,
}: {
  list: { id: string; version: number; items: Film[] }
  onClose: () => void
}) {
  const [history, setHistory] = useState<string[][]>([
    list.items.map((i) => i.id),
  ])
  const [review, setReview] = useState(false)
  const utils = api.useUtils()
  const save = api.lists.reorder.useMutation({
    onSuccess: async () => {
      await utils.lists.all.invalidate()
      notify('Ranking updated')
      onClose()
    },
  })
  const order = history[history.length - 1]!
  const step = history.length - 1
  const rounds = Math.min(9, list.items.length - 1)
  const done = review || step >= rounds
  const choose = (choice: 'left' | 'right' | 'tie' | 'skip') =>
    setHistory((h) => [...h, comparePair(order, step, choice)])
  return (
    <Dialog
      open
      onClose={() => {
        if (
          !save.isPending &&
          (history.length === 1 || confirm('Discard this comparison session?'))
        )
          onClose()
      }}
      title="A little friendly competition"
    >
      <p className="mb-4 text-sm text-zinc-400">
        Tune up the first {rounds + 1} spots, one neighboring pair at a time.
        Ties and skips keep their current order. Your star ratings stay the
        same.
      </p>
      {done ? (
        <>
          <h3 className="font-semibold">Your proposed ranking</h3>
          <ol className="my-4 space-y-2">
            {order.map((id, i) => (
              <li key={id}>
                {i + 1}. {list.items.find((f) => f.id === id)?.name}
              </li>
            ))}
          </ol>
          {save.error && (
            <p role="alert" className="mb-3 text-pink-300">
              {save.error.message} Close this session and reopen it to use the
              latest list.
            </p>
          )}
          <button
            className="btn-brand"
            disabled={save.isPending || !!save.error}
            onClick={() =>
              save.mutate({
                id: list.id,
                version: list.version,
                itemIds: order,
              })
            }
          >
            {save.isPending ? 'Saving…' : 'Apply ranking'}
          </button>
        </>
      ) : (
        <>
          <p aria-live="polite" className="eyebrow mb-3">
            Pair {step + 1} of {rounds} · Which would you rank higher?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {(['left', 'right'] as const).map((choice, i) => {
              const film = list.items.find((f) => f.id === order[step + i])!
              return (
                <button
                  key={film.id}
                  className="surface p-3 text-center hover:!border-pink-300"
                  onClick={() => choose(choice)}
                >
                  <Image
                    src={film.posterImage || '/placeholderposter.png'}
                    width={140}
                    height={210}
                    alt=""
                    className="mx-auto mb-3 rounded-lg"
                  />
                  <span className="font-semibold">{film.name}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="btn-ghost" onClick={() => choose('tie')}>
              Too close to call
            </button>
            <button className="btn-ghost" onClick={() => choose('skip')}>
              Skip pair
            </button>
            <button className="btn-ghost" onClick={() => setReview(true)}>
              Review now
            </button>
          </div>
        </>
      )}
      {history.length > 1 && (
        <button
          className="mt-4 block text-pink-300"
          disabled={save.isPending}
          onClick={() => {
            setHistory((h) => h.slice(0, -1))
            setReview(false)
          }}
        >
          Undo last choice
        </button>
      )}
    </Dialog>
  )
}
