interface IconProps {
  active: boolean
}

export const LeftSignal = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
  >
    <path
      d="M14 7L9 12L14 17"
      stroke={active ? '#4ADE80' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const RightSignal = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
  >
    <path
      d="M10 7L15 12L10 17"
      stroke={active ? '#4ADE80' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Seatbelt = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'blink' : 'opacity-30'}`}
  >
    <path
      d="M12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4Z"
      fill={active ? '#EF4444' : '#6B7280'}
    />
    <path
      d="M8 11L6 20H18L16 11"
      stroke={active ? '#EF4444' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Engine = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'blink' : 'opacity-30'}`}
  >
    <path
      d="M7 9H17V15H7V9Z"
      stroke={active ? '#EF4444' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 12H5V10H3V14H5V12H7"
      stroke={active ? '#EF4444' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 12H19V10H21V14H19V12H17"
      stroke={active ? '#EF4444' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Headlights = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
  >
    <circle
      cx="12"
      cy="12"
      r="4"
      fill={active ? '#60A5FA' : '#6B7280'}
    />
    <path
      d="M12 2V6M12 18V22M22 12H18M6 12H2M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93"
      stroke={active ? '#60A5FA' : '#6B7280'}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const ABS = ({ active }: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke={active ? '#EF4444' : '#6B7280'}
      strokeWidth="2"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="10"
      fontWeight="bold"
      fill={active ? '#EF4444' : '#6B7280'}
    >
      ABS
    </text>
  </svg>
)
