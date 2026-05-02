import Link from "next/link";

type RoleCardProps = {
  audience: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  bullets: string[];
  tone: "teal" | "amber";
};

const toneStyles = {
  teal: {
    badge: "bg-[rgba(15,118,110,0.1)] text-[var(--accent)]",
    link: "text-[var(--accent)] hover:text-[var(--accent-strong)]",
  },
  amber: {
    badge: "bg-[rgba(234,88,12,0.1)] text-[var(--accent-warm)]",
    link: "text-[var(--accent-warm)] hover:text-[var(--accent-strong)]",
  },
} as const;

export function RoleCard({
  audience,
  title,
  description,
  href,
  cta,
  bullets,
  tone,
}: RoleCardProps) {
  const styles = toneStyles[tone];

  return (
    <article className="glass-panel rounded-[32px] border border-[color:var(--line)] p-6 sm:p-7">
      <div
        className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${styles.badge}`}
      >
        {audience}
      </div>
      <h2 className="display-face mt-5 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[var(--muted)]">{description}</p>
      <div className="mt-6 grid gap-3">
        {bullets.map((bullet) => (
          <div
            key={bullet}
            className="rounded-[22px] border border-[color:var(--line)] bg-white/70 px-4 py-4 text-sm leading-6 text-[var(--muted)]"
          >
            {bullet}
          </div>
        ))}
      </div>
      <Link className={`mt-6 inline-flex text-sm font-semibold ${styles.link}`} href={href}>
        {cta}
      </Link>
    </article>
  );
}
