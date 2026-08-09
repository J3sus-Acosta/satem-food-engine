'use client'

import React, { useState, useTransition } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface LocationOption {
  id: string
  name: string
  slug: string
}

interface LocationSwitcherProps {
  locations: LocationOption[]
  currentLocationId: string
}

export default function LocationSwitcher({ locations, currentLocationId }: LocationSwitcherProps) {
  const [selectedId, setSelectedId] = useState(currentLocationId)
  const [isPending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocationId = e.target.value
    setSelectedId(newLocationId)

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/switch-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locationId: newLocationId }),
        })

        if (!res.ok) {
          const json = await res.json()
          alert(json.error || 'Error al cambiar de sucursal')
          setSelectedId(currentLocationId)
          return
        }

        // Refresh window to re-render all Server Components with the new active location
        window.location.reload()
      } catch (err) {
        console.error('Error switching location:', err)
        setSelectedId(currentLocationId)
      }
    })
  }

  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm transition hover:border-slate-300">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
        ) : (
          <MapPin className="h-3.5 w-3.5 text-slate-500" />
        )}
        <select
          value={selectedId}
          onChange={handleChange}
          disabled={isPending}
          className="cursor-pointer bg-transparent text-xs font-extrabold text-slate-800 outline-none disabled:opacity-50"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
