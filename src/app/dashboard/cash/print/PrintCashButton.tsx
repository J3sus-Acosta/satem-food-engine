'use client'

import React, { useEffect } from 'react'

export function PrintCashButton() {
  useEffect(() => {
    // Auto-trigger window.print() after component mounts on client
    const timer = setTimeout(() => {
      window.print()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <button type="button" onClick={() => window.print()} className="print-btn">
      🖨️ Imprimir Reporte
    </button>
  )
}
