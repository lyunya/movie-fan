'use client'

import { useState } from 'react'
import type { FC } from 'react'
import { HiOutlineClipboardCopy, HiCheck } from 'react-icons/hi'
import { api } from '@/utils/api'

interface ProfileSettingsProps {
  userId: string
  isPublic: boolean
  alertsEnabled: boolean
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
}) => {
  const utils = api.useUtils()
  const invalidate = () => utils.user.query.invalidate()
  const setPublic = api.user.setPublic.useMutation({ onSuccess: invalidate })
  const setAlerts = api.user.setStreamAlerts.useMutation({
    onSuccess: invalidate,
  })
  const [copied, setCopied] = useState(false)

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
      </div>
    </section>
  )
}

export default ProfileSettings
