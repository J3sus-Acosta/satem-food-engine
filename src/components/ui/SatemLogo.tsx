import React from 'react'

interface SatemLogoProps {
  className?: string
}

export function SatemLogo({ className = 'h-5 w-auto text-current' }: SatemLogoProps) {
  return (
    <svg
      className={`inline-block shrink-0 align-middle ${className}`}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Network Connecting Lines (stopping at circle borders) */}
      <g stroke="currentColor" strokeWidth="10" strokeLinecap="round">
        {/* N1 (100,20) to N2 (60,90) */}
        <line x1="93.1" y1="32.2" x2="66.9" y2="77.8" />
        {/* N1 (100,20) to N3 (140,90) */}
        <line x1="106.9" y1="32.2" x2="133.1" y2="77.8" />

        {/* N2 (60,90) to N3 (140,90) */}
        <line x1="74" y1="90" x2="126" y2="90" />
        {/* N2 (60,90) to N4 (20,160) */}
        <line x1="53.1" y1="102.2" x2="26.9" y2="147.8" />
        {/* N2 (60,90) to N5 (100,160) */}
        <line x1="66.9" y1="102.2" x2="93.1" y2="147.8" />

        {/* N3 (140,90) to N5 (100,160) */}
        <line x1="133.1" y1="102.2" x2="106.9" y2="147.8" />
        {/* N3 (140,90) to N6 (180,160) */}
        <line x1="146.9" y1="102.2" x2="173.1" y2="147.8" />

        {/* N4 (20,160) to N5 (100,160) */}
        <line x1="34" y1="160" x2="86" y2="160" />
        {/* N5 (100,160) to N6 (180,160) */}
        <line x1="114" y1="160" x2="166" y2="160" />
      </g>

      {/* Hollow Ring Nodes */}
      <g stroke="currentColor" strokeWidth="9" fill="none">
        {/* Top Node */}
        <circle cx="100" cy="20" r="14" />
        {/* Middle Row Nodes */}
        <circle cx="60" cy="90" r="14" />
        <circle cx="140" cy="90" r="14" />
        {/* Bottom Row Nodes */}
        <circle cx="20" cy="160" r="14" />
        <circle cx="100" cy="160" r="14" />
        <circle cx="180" cy="160" r="14" />
      </g>
    </svg>
  )
}
