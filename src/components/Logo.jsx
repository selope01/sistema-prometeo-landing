function Logo({ className = '', tone = 'onLight' }) {
  const fistFill = tone === 'onLight' ? 'fill-prometeo-navy' : 'fill-white'
  const flameOuter = tone === 'onLight' ? 'fill-prometeo-red' : 'fill-prometeo-navy'

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <path
        className={flameOuter}
        d="M100,8 C76,34 58,52 58,76 C58,102 78,116 100,116 C122,116 142,102 142,76 C142,52 124,34 100,8 Z"
      />
      <path
        className="fill-white"
        d="M100,46 C87,60 80,70 82,83 C84,96 91,103 100,103 C109,103 116,96 118,83 C120,70 113,60 100,46 Z"
      />
      <g className={fistFill}>
        <rect x="34" y="120" width="46" height="34" rx="17" transform="rotate(-18 57 137)" />
        <circle cx="68" cy="98" r="17" />
        <circle cx="92" cy="90" r="18" />
        <circle cx="116" cy="90" r="18" />
        <circle cx="140" cy="98" r="17" />
        <rect x="58" y="98" width="90" height="70" rx="24" />
        <rect x="70" y="160" width="64" height="34" rx="10" />
      </g>
    </svg>
  )
}

export default Logo
