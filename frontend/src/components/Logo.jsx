export default function Logo({ size = 36, showWordmark = true, dark = false }) {
  const textColor = dark ? "text-white" : "text-ink-900";

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="veltra-mark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b8def" />
            <stop offset="1" stopColor="#1f47b8" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#veltra-mark)" />
        <path
          d="M11 13L20 27L29 13"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 27V13"
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className={`font-semibold tracking-tight text-lg ${textColor}`}>
          Veltra <span className="font-normal text-brand-500">Pay</span>
        </span>
      )}
    </div>
  );
}
