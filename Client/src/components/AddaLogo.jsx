
export default function AddaLogo({
  className = "w-48",
  bubble = "#F4B63F",
  ink = "#123C3A",
}) {
  return (
    <svg
      viewBox="0 0 240 120"
      className={className}
      role="img"
      aria-label="Adda"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={bubble}
        d="M40 4H200C222 4 236 22 236 50S222 96 200 96H76C64 110 46 117 24 116C34 109 39 101 39 94C18 91 4 74 4 50C4 22 18 4 40 4Z"
      />
      <g fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round">
        {/* a */}
        <circle cx="42" cy="56" r="15" />
        <path d="M57 41V71" />
        {/* d */}
        <circle cx="90" cy="56" r="15" />
        <path d="M105 23V71" />
        {/* d */}
        <circle cx="138" cy="56" r="15" />
        <path d="M153 23V71" />
        {/* a */}
        <circle cx="186" cy="56" r="15" />
        <path d="M201 41V71" />
      </g>
    </svg>
  );
}
