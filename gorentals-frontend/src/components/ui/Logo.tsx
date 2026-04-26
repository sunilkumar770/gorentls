/**
 * GoRentals brand mark — shared across Navbar, Footer, and auth pages.
 * Pure SVG, no Lucide dependency. Accepts size + className for flexibility.
 * Callers own the Link wrapper so this stays layout-agnostic.
 */
interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="#01696f" />
      <path
        d="M10 16.5C10 13.46 12.46 11 15.5 11C17.36 11 19.02 11.94 20 13.38L17.5 14.9C17.06 14.34 16.32 14 15.5 14C14.12 14 13 15.12 13 16.5C13 17.88 14.12 19 15.5 19H17V17.5H15.5V15.5H19.5V19C19.5 20.66 17.88 22 15.5 22C12.46 22 10 19.54 10 16.5Z"
        fill="white"
      />
    </svg>
  );
}
