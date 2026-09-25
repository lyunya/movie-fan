import { REGIONS } from '@/server/availability/regions'

/** The Region <option>s, one list for the whole app. */
export default function RegionOptions() {
  return (
    <>
      {REGIONS.map((r) => (
        <option key={r.code} value={r.code}>
          {r.name}
        </option>
      ))}
    </>
  )
}
