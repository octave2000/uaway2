/** Decorative, scalable artwork: no map service or client-side runtime. */
export function JourneyScene() {
  return (
    <svg
      viewBox="0 0 1200 490"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <linearGradient
          id="scene-ground"
          x1="600"
          y1="0"
          x2="600"
          y2="490"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fafbf9" />
          <stop offset="1" stopColor="#e8eeeb" />
        </linearGradient>
        <linearGradient
          id="scene-car"
          x1="0"
          y1="-35"
          x2="0"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="#adb9b8" />
        </linearGradient>
        <linearGradient id="scene-tree">
          <stop stopColor="#c6dfab" />
          <stop offset="1" stopColor="#719e74" />
        </linearGradient>
        <filter id="scene-shadow" x="-50%" y="-70%" width="200%" height="250%">
          <feDropShadow
            dx="0"
            dy="12"
            stdDeviation="9"
            floodColor="#193e36"
            floodOpacity=".14"
          />
        </filter>
        <g id="scene-tree-shape">
          <ellipse cy="10" rx="21" ry="9" fill="#527259" opacity=".1" />
          <path d="M-3 0h6v14h-6z" fill="#a89c86" />
          <path
            d="M0-59C-5-59-27-11-23-5C-16 9 16 9 23-5C27-11 5-59 0-59Z"
            fill="url(#scene-tree)"
          />
          <path
            d="M0-59C-5-40-8-11 0 4C-12 4-22 0-23-5C-27-11-5-59 0-59Z"
            fill="#d7e8c2"
            opacity=".65"
          />
        </g>
        <g id="scene-building">
          <path d="M-25-8 0-23 25-8 0 7Z" fill="#fafcfb" />
          <path d="M-25-8V-81L0-96V7Z" fill="#d8dfdd" />
          <path d="M0-96 25-81V-8L0 7Z" fill="#b9c5c1" />
          <path d="m-25-81 25-15 25 15L0-66Z" fill="#edf1ef" />
          {[0, 1, 2, 3].map((n) => (
            <path
              key={n}
              d={`M5 ${-59 + n * 14}l14-8v7l-14 8z`}
              fill="#e7eeea"
            />
          ))}
        </g>
        <g id="scene-car-shape" filter="url(#scene-shadow)">
          <ellipse cy="19" rx="60" ry="22" fill="#123329" opacity=".12" />
          <ellipse cx="-32" cy="19" rx="11" ry="16" fill="#243230" />
          <ellipse cx="38" cy="15" rx="11" ry="16" fill="#243230" />
          <path
            d="M-60 1Q-62-11-44-18l22-20q9-7 26-6l24 4q10 3 21 21l12 6q8 5 6 21l-5 12q-3 7-18 9l-79-2q-23-2-25-15Z"
            fill="url(#scene-car)"
            stroke="#fff"
            strokeWidth="1.5"
          />
          <path d="m-35-19 19-18q5-4 19-3l18 3-1 24Z" fill="#465b5c" />
          <path d="m26-35 12 4 13 20-27-2Z" fill="#6a7d7c" />
          <path d="m-35-19 55 6-4 3-60-4Z" fill="#e6eeea" />
          <path
            d="M-54 4q23 10 48 8M-3-37l-3 21"
            stroke="#f5faf7"
            strokeWidth="3"
          />
          <path
            d="m-54 7 14 4m51 2 13-3"
            stroke="white"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <ellipse cx="38" cy="18" rx="10" ry="15" fill="#263633" />
          <ellipse cx="38" cy="18" rx="6" ry="10" fill="#bfcbc6" />
          <path d="M-55 20q20 9 46 5" stroke="#7f918a" strokeWidth="3" />
        </g>
        <g id="scene-pin">
          <ellipse cy="9" rx="17" ry="7" fill="#183c34" opacity=".15" />
          <path
            d="M0 0s-23-26-23-42a23 23 0 0 1 46 0C23-26 0 0 0 0Z"
            fill="#103f44"
          />
          <circle cy="-42" r="9" fill="white" />
        </g>
      </defs>
      <path d="m-60 262 610-227 730 236-615 305Z" fill="url(#scene-ground)" />
      <path d="m1035 201 230 73-6 180-207-54-87-84Z" fill="#c8e7ef" />
      <g stroke="white" strokeWidth="24" strokeLinejoin="round">
        <path d="m-80 292 618-225 740 240M52 443 652 208 1172 386M282 525 840 297M53 197 703 509M302 111 1085 465M782 115 124 406" />
      </g>
      <path d="m715 288 115-43 137 46-106 51Z" fill="#d7ebbd" />
      <path d="m313 352 101-41 148 62-115 47Z" fill="#dcebc9" />
      <path d="m971 352 79-33 82 32-61 51Z" fill="#d7ebbd" />
      <path
        d="M229 327 511 435Q533 443 554 433L839 315Q853 309 870 315l106 39q18 6 34-1l76-35"
        stroke="#163e42"
        strokeWidth="19"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M229 327 511 435Q533 443 554 433L839 315Q853 309 870 315l106 39q18 6 34-1l76-35"
        stroke="#8fb3aa"
        strokeWidth="2"
        strokeDasharray="9 12"
        strokeLinecap="round"
      />
      <use href="#scene-building" transform="translate(382 196) scale(.85)" />
      <use href="#scene-building" transform="translate(442 217) scale(.6)" />
      <use href="#scene-building" transform="translate(168 300) scale(.8)" />
      <use href="#scene-building" transform="translate(952 226) scale(.65)" />
      <use href="#scene-building" transform="translate(702 467) scale(1.1)" />
      <use href="#scene-tree-shape" transform="translate(765 287) scale(.85)" />
      <use href="#scene-tree-shape" transform="translate(822 299) scale(.65)" />
      <use href="#scene-tree-shape" transform="translate(381 367)" />
      <use href="#scene-tree-shape" transform="translate(456 391) scale(.7)" />
      <use href="#scene-tree-shape" transform="translate(1044 371) scale(.8)" />
      <use href="#scene-tree-shape" transform="translate(932 444)" />
      <use href="#scene-pin" transform="translate(229 327)" />
      <use href="#scene-pin" transform="translate(1086 318) scale(.8)" />
      <use href="#scene-car-shape" transform="translate(596 208) scale(.47)" />
      <use href="#scene-car-shape" transform="translate(922 255) scale(.38)" />
      <use
        href="#scene-car-shape"
        transform="translate(678 377) rotate(-17) scale(1.12)"
      />
    </svg>
  );
}
