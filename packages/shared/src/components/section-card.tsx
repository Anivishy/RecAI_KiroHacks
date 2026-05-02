import type { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={`glass-panel rounded-[30px] border border-[color:var(--line)] p-6 sm:p-7 ${
        className ?? ""
      }`}
    >
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
