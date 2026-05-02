import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgProps({ size = 14, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    "aria-hidden": "true" as const,
    ...rest,
  };
}

export function Check(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...svgProps(props)}>
      <polyline points="3.5 8.5 6.8 11.5 12.5 5" />
    </svg>
  );
}

export function CheckBadge(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...svgProps({ size: 16, ...props })}>
      <path d="M12 2.2 14.4 4 17.4 3.6 18.6 6.4 21.4 7.6 21 10.6 22.8 13 21 15.4 21.4 18.4 18.6 19.6 17.4 22.4 14.4 22 12 23.8 9.6 22 6.6 22.4 5.4 19.6 2.6 18.4 3 15.4 1.2 13 3 10.6 2.6 7.6 5.4 6.4 6.6 3.6 9.6 4Z" />
      <path d="M8 12.2 10.6 14.8 16 9.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Search(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...svgProps({ size: 16, ...props })}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5 L13.5 13.5" />
    </svg>
  );
}

export function Mail(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...svgProps(props)}>
      <rect x="2" y="3.5" width="12" height="9" rx="1.6" />
      <path d="M2.4 4.5 L8 9 L13.6 4.5" />
    </svg>
  );
}

export function Github(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...svgProps(props)}>
      <path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.6-.2.6-.4v-1.4c-2.2.5-2.7-1-2.7-1-.4-1-1-1.2-1-1.2-.7-.5.1-.5.1-.5.8 0 1.3.9 1.3.9.7 1.3 2 .9 2.5.7 0-.6.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2 0-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.2.6.7.6 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 8 0z" />
    </svg>
  );
}

export function Linkedin(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...svgProps(props)}>
      <path d="M3.6 5.5h2.2v7.8H3.6zM4.7 2.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM7.4 5.5h2.1v1.1c.3-.6 1.1-1.3 2.3-1.3 2.5 0 3 1.6 3 3.7v4.3h-2.2V9.5c0-1 0-2.2-1.4-2.2s-1.5 1.1-1.5 2.1v3.9H7.4z" />
    </svg>
  );
}

export function Globe(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" {...svgProps(props)}>
      <circle cx="8" cy="8" r="6" />
      <ellipse cx="8" cy="8" rx="2.5" ry="6" />
      <path d="M2 8h12" />
    </svg>
  );
}

export function Chevron(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...svgProps({ size: 18, ...props })}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function Plus(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...svgProps(props)}>
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...svgProps(props)}>
      <path d="M8 1l1.4 4.2L13.6 6 9.4 7.4 8 11.6 6.6 7.4 2.4 6 6.6 5.2z" />
      <path d="M13 11l.6 1.6L15.2 13l-1.6.6L13 15.2l-.6-1.6L10.8 13l1.6-.4z" />
    </svg>
  );
}

export function Lock(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...svgProps({ size: 12, ...props })}>
      <rect x="3" y="7" width="10" height="7" rx="1.2" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </svg>
  );
}

export function Pin(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...svgProps(props)}>
      <path d="M8 14.5V9" />
      <path d="M5 9h6l-1.2-3 1.2-2.5H4.8L6 6.5z" />
    </svg>
  );
}

export function Calendar(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" {...svgProps(props)}>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.4" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...svgProps(props)}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function Eye(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" {...svgProps(props)}>
      <path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
