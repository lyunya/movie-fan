'use client'

import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { HiOutlineClipboardCopy, HiCheck } from 'react-icons/hi'
import { api } from '@/utils/api'

interface ProfileSettingsProps {
  userId: string
  isPublic: boolean
  alertsEnabled: boolean
  watchRegion: string
  preferredProviders: number[]
}

const Toggle: FC<{
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (value: boolean) => void
}> = ({ label, description, checked, disabled, onChange }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="font-semibold text-white">{label}</p>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-gradient-to-br from-pink-500 to-red-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  </div>
)

const ProfileSettings: FC<ProfileSettingsProps> = ({
  userId,
  isPublic,
  alertsEnabled,
  watchRegion,
  preferredProviders,
}) => {
  const utils = api.useUtils()
  const invalidate = () => utils.user.query.invalidate()
  const setPublic = api.user.setPublic.useMutation({ onSuccess: invalidate })
  const setAlerts = api.user.setStreamAlerts.useMutation({
    onSuccess: invalidate,
  })
  const [copied, setCopied] = useState(false)
  const [region, setRegion] = useState(watchRegion)
  const [providers, setProviders] = useState(preferredProviders)
  const providerOptions = api.tmdb.providers.useQuery({ region })
  const savePreferences = api.user.setStreamingPreferences.useMutation({
    onSuccess: invalidate,
  })

  useEffect(() => {
    setRegion(watchRegion)
    setProviders(preferredProviders)
  }, [preferredProviders, watchRegion])

  const toggleProvider = (id: number) => {
    setProviders((current) =>
      current.includes(id)
        ? current.filter((providerId) => providerId !== id)
        : [...current, id].slice(0, 20)
    )
  }

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/u/${userId}` : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — nothing to do */
    }
  }

  return (
    <section className="surface mb-10 p-5">
      <h2 className="mb-4 font-heading text-xl font-bold text-white">
        Sharing &amp; alerts
      </h2>
      <div className="flex flex-col gap-5">
        <Toggle
          label="Public watchlist"
          description="Anyone with the link can view your saved movies (no account details shown)."
          checked={isPublic}
          disabled={setPublic.isPending}
          onChange={(value) => setPublic.mutate({ public: value })}
        />

        {isPublic && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 truncate rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none"
            />
            <button onClick={copy} className="btn-ghost !px-4 !py-2 !text-sm">
              {copied ? (
                <>
                  <HiCheck className="h-4 w-4 text-green-400" /> Copied
                </>
              ) : (
                <>
                  <HiOutlineClipboardCopy className="h-4 w-4" /> Copy link
                </>
              )}
            </button>
          </div>
        )}

        <Toggle
          label="Streaming alerts"
          description="Email me when a movie on my watchlist becomes available to stream."
          checked={alertsEnabled}
          disabled={setAlerts.isPending}
          onChange={(value) => setAlerts.mutate({ enabled: value })}
        />

        <div className="border-t border-zinc-800 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-semibold text-white">
                Your streaming services
              </p>
              <p className="text-sm text-zinc-400">
                Used by Tonight picks, group rooms, and availability alerts.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              Region
              <select
                value={region}
                onChange={(event) => {
                  setRegion(event.target.value)
                  setProviders([])
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-pink-500"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(providerOptions.data ?? [])
              .filter(
                (provider) =>
                  !/(Store|Google Play|Amazon Video|Fandango|YouTube$)/i.test(
                    provider.name
                  )
              )
              .slice(0, 24)
              .map((provider) => {
                const selected = providers.includes(provider.id)
                return (
                  <button
                    key={provider.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleProvider(provider.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      selected
                        ? 'border-pink-500 bg-pink-500/15 text-pink-200'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    {provider.name}
                  </button>
                )
              })}
          </div>

          <button
            type="button"
            disabled={savePreferences.isPending}
            onClick={() =>
              savePreferences.mutate({
                watchRegion: region,
                preferredProviders: providers,
              })
            }
            className="btn-brand mt-4 !px-5 !py-2 !text-sm"
          >
            {savePreferences.isPending ? 'Saving…' : 'Save streaming services'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfileSettings
