export function Bird({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M13 38c9-1 12-16 23-14 7 1 9 6 10 10l9 3-10 3c-6 13-20 15-29 8l-8 2 5-12Z"
        fill="currentColor"
      />
      <path
        d="M29 33 13 12c16 3 22 8 23 15M31 39 19 26M29 43 16 37"
        stroke="var(--bird-line,#f3d494)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="42" cy="32" r="1.6" fill="var(--bird-line,#f3d494)" />
      <path d="M16 48v8l11-3 11 3v-9" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="12" r="3" fill="var(--bird-line,#f3d494)" />
      <circle cx="9" cy="28" r="2.5" fill="var(--bird-line,#f3d494)" />
    </svg>
  );
}
export function VillageArt() {
  return (
    <svg
      className="village-art"
      viewBox="0 0 600 280"
      fill="none"
      role="img"
      aria-label="Original illustration of a village school and health clinic connected by a winding path"
    >
      <defs>
        <pattern id="lines" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 8 0" stroke="#5c7455" strokeOpacity=".14" />
        </pattern>
      </defs>
      <circle cx="447" cy="61" r="30" fill="#e8b65b" />
      <path d="M0 201Q90 115 230 194T600 151V280H0Z" fill="#c3c99d" />
      <path d="M0 240Q150 163 310 221T600 201V280H0Z" fill="#9da980" />
      <path d="M300 280Q349 241 290 218T329 159" stroke="#f7efcf" strokeWidth="27" />
      <path d="M300 280Q349 241 290 218T329 159" stroke="#c7aa77" strokeDasharray="4 7" />
      <path d="M75 184V102h133v82" fill="#f8f0d5" stroke="#405a43" strokeWidth="2" />
      <path d="m60 104 82-46 81 46Z" fill="#bf7650" stroke="#405a43" strokeWidth="2" />
      <path d="M100 128h25v26h-25zm58 0h25v26h-25z" fill="#8fae9d" stroke="#405a43" strokeWidth="2" />
      <path d="M132 184v-46h20v46" fill="#6c7c5e" />
      <path d="M141 59V26l28 9-28 9" fill="#e6b44e" stroke="#405a43" strokeWidth="2" />
      <path d="M83 169h117" stroke="#405a43" />
      <path d="M368 174v-58h118v58" fill="#e9d8b6" stroke="#405a43" strokeWidth="2" />
      <path d="m356 117 71-38 72 38Z" fill="#597963" stroke="#405a43" strokeWidth="2" />
      <path d="M417 174v-32h20v32" fill="#8fae9d" stroke="#405a43" />
      <path d="M384 134h17v19h-17zm69 0h17v19h-17z" fill="#faf1db" stroke="#405a43" />
      <path d="M424 93v18m-9-9h18" stroke="#f8edd4" strokeWidth="4" />
      <path d="M536 205V98m0 49-24-19m24 42 23-20" stroke="#486147" strokeWidth="4" />
      <path
        d="M536 79c-37-20-57 26-28 43-34 15-16 52 13 40 19 26 57 7 43-15 31-18 14-55-9-53 4-19-10-28-19-15Z"
        fill="#657e56"
      />
      <path d="M33 218v-62m0 28-14-9" stroke="#486147" strokeWidth="3" />
      <ellipse cx="33" cy="150" rx="23" ry="38" fill="#81916a" />
      <path
        d="M241 208v-30m0 5-9 13m9-13 9 13m-9 12-7 20m7-20 8 20"
        stroke="#475a43"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="241" cy="171" r="7" fill="#b97a53" />
      <path
        d="M263 207v-22m0 7-8 7m8-7 7 7m-7 7-5 18m5-18 6 18"
        stroke="#b97348"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="263" cy="180" r="6" fill="#b97a53" />
      <path
        d="m278 64 7-5 7 5m-40-21 6-4 6 4m61 12 6-4 6 4"
        stroke="#536a50"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M182 246q15-20 30 0m-14-4v17m-43-14 5-10 5 10m223-24 5-10 5 10"
        stroke="#62734e"
        strokeWidth="2"
      />
      <path d="M226 123q52-28 112 1" stroke="#667a58" strokeDasharray="3 5" />
      <circle cx="226" cy="123" r="4" fill="#667a58" />
      <circle cx="338" cy="124" r="4" fill="#667a58" />
    </svg>
  );
}
