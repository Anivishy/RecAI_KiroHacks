import type { HTMLAttributes, ReactNode } from "react";

type MonoProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
};

export function Mono({ children, className, ...rest }: MonoProps) {
  return (
    <span {...rest} className={["mono", className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
