import type { CandidateBanner } from "@recai/shared";

type CandidateBannerEditorProps = {
  banner: CandidateBanner;
  status?: "saved" | "error" | null;
};

const inputClassName =
  "mt-1 w-full rounded-[14px] border border-[color:var(--line)] bg-white px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export function CandidateBannerEditor({
  banner,
  status,
}: CandidateBannerEditorProps) {
  return (
    <section className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.06)] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          Edit profile banner
        </h3>
        {status === "saved" ? (
          <span className="rounded-full bg-[rgba(15,118,110,0.15)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Saved ✓
          </span>
        ) : null}
        {status === "error" ? (
          <span className="rounded-full bg-[rgba(220,38,38,0.15)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b91c1c]">
            Save failed
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        Public-facing contact links. Display-only — never indexed for search.
      </p>

      <form
        action="/api/candidate/profile/banner"
        className="mt-4 grid gap-3"
        method="post"
      >
        <label className="text-xs font-semibold text-[var(--foreground)]">
          Email
          <input
            className={inputClassName}
            defaultValue={banner.email ?? ""}
            name="bannerEmail"
            placeholder="you@example.com"
            type="email"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          GitHub
          <input
            className={inputClassName}
            defaultValue={banner.githubUrl ?? ""}
            name="bannerGithub"
            placeholder="github.com/yourhandle"
            type="text"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          LinkedIn
          <input
            className={inputClassName}
            defaultValue={banner.linkedinUrl ?? ""}
            name="bannerLinkedin"
            placeholder="linkedin.com/in/yourhandle"
            type="text"
          />
        </label>

        <label className="text-xs font-semibold text-[var(--foreground)]">
          Personal website
          <input
            className={inputClassName}
            defaultValue={banner.websiteUrl ?? ""}
            name="bannerWebsite"
            placeholder="https://yoursite.com"
            type="text"
          />
        </label>

        <button
          className="mt-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
          type="submit"
        >
          Save banner
        </button>
      </form>
    </section>
  );
}
