import type { ReactNode } from "react";

type DivProps = {
  children: ReactNode;
  className?: string;
};

type CardHeadProps = Omit<DivProps, "children"> & {
  eyebrow: string;
  meta?: ReactNode;
};

export function Card({ children, className }: DivProps) {
  return (
    <section className={["card", className].filter(Boolean).join(" ")}>
      {children}
    </section>
  );
}

export function CardHead({ eyebrow, meta, className, children }: CardHeadProps & { children?: ReactNode }) {
  return (
    <div className={["card-head", className].filter(Boolean).join(" ")}>
      <h3>{eyebrow}</h3>
      {meta ? <span className="text-[12px] text-[var(--ink-3)]">{meta}</span> : null}
      {children}
    </div>
  );
}

export function CardPad({ children, className }: DivProps) {
  return <div className={["card-pad", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function CardPadTight({ children, className }: DivProps) {
  return <div className={["card-pad-tight", className].filter(Boolean).join(" ")}>{children}</div>;
}
