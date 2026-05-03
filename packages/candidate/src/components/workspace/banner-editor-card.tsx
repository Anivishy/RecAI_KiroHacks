import * as Icons from "@recai/shared/components/icons";
import { Card, CardHead, CardPad, Mono } from "@recai/shared";
import type { CandidateBanner } from "@recai/shared";

type BannerEditorCardProps = {
  banner: CandidateBanner;
  status?: "saved" | "error" | null;
};

const inputClass =
  "mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

export function BannerEditorCard({ banner, status }: BannerEditorCardProps) {
  return (
    <Card>
      <CardHead
        eyebrow="Edit profile banner"
        meta={
          status === "saved" ? (
            <Mono className="text-[11px] text-[color:var(--verified)]">saved ✓</Mono>
          ) : status === "error" ? (
            <Mono className="text-[11px] text-[#b91c1c]">save failed</Mono>
          ) : null
        }
      />
      <CardPad>
        <p className="text-[12px] leading-5 text-[color:var(--ink-3)]">
          Public-facing contact links. <span className="mono text-[11px] text-[color:var(--ink-4)]">Not indexed</span>
        </p>
        <form action="/api/candidate/profile/banner" className="mt-4 grid gap-3" method="post">
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            <span className="inline-flex items-center gap-1.5"><Icons.Mail size={13} /> Email</span>
            <input className={inputClass} defaultValue={banner.email ?? ""} name="bannerEmail" placeholder="you@example.com" type="email" />
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            <span className="inline-flex items-center gap-1.5"><Icons.Github size={13} /> GitHub</span>
            <input className={inputClass} defaultValue={banner.githubUrl ?? ""} name="bannerGithub" placeholder="github.com/yourhandle" type="text" />
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            <span className="inline-flex items-center gap-1.5"><Icons.Linkedin size={13} /> LinkedIn</span>
            <input className={inputClass} defaultValue={banner.linkedinUrl ?? ""} name="bannerLinkedin" placeholder="linkedin.com/in/yourhandle" type="text" />
          </label>
          <label className="text-[12px] font-semibold text-[color:var(--ink)]">
            <span className="inline-flex items-center gap-1.5"><Icons.Globe size={13} /> Website</span>
            <input className={inputClass} defaultValue={banner.websiteUrl ?? ""} name="bannerWebsite" placeholder="https://yoursite.com" type="text" />
          </label>
          <button
            className="mt-2 inline-flex items-center justify-center rounded-full bg-[color:var(--verified)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
            type="submit"
          >
            Save banner
          </button>
        </form>
      </CardPad>
    </Card>
  );
}
