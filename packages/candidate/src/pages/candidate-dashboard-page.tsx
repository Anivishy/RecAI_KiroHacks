import {
  TopNav,
  buildExperienceRows,
} from "@recai/shared";
import { getJoinedPostingsForCandidate } from "@recai/recruiter/server/recruiter-jobs";
import { ExperienceList } from "../components/profile/experience-list";
import { HeroCard, type HeroLink } from "../components/profile/hero-card";
import { AccountCard } from "../components/workspace/account-card";
import { BannerEditorCard } from "../components/workspace/banner-editor-card";
import { JoinedGroupsCard } from "../components/workspace/joined-groups-card";
import {
  getCandidateBanner,
  requireCandidateSession,
} from "../server/candidate-auth";
import { getCandidateProfileById } from "../server/candidate-profile-db";

type CandidateDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

const noticeMessages: Record<string, string> = {
  "already-joined":
    "You were already in that recruiter candidate pool, so your workspace stayed unchanged.",
  "joined-posting":
    "You were added to the recruiter candidate pool linked from that posting.",
};

const errorMessages: Record<string, string> = {
  "invalid-invite":
    "That recruiter invite link is no longer valid. Ask the recruiter for a fresh recAI link.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function bannerStatusFromParams(notice?: string, error?: string): "saved" | "error" | null {
  if (notice === "banner-saved") return "saved";
  if (error === "banner-save-failed") return "error";
  return null;
}

function getInitials(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function buildContactLinks(banner: { email: string | null; githubUrl: string | null; linkedinUrl: string | null; websiteUrl: string | null }): HeroLink[] {
  const links: HeroLink[] = [];
  if (banner.email) links.push({ kind: "email", label: banner.email, href: `mailto:${banner.email}` });
  if (banner.githubUrl) links.push({ kind: "github", label: banner.githubUrl, href: banner.githubUrl });
  if (banner.linkedinUrl) links.push({ kind: "linkedin", label: banner.linkedinUrl, href: banner.linkedinUrl });
  if (banner.websiteUrl) links.push({ kind: "website", label: banner.websiteUrl, href: banner.websiteUrl });
  return links;
}

export async function CandidateDashboardPage({ searchParams }: CandidateDashboardPageProps) {
  const session = await requireCandidateSession();
  const [banner, candidateProfile, joinedPostings] = await Promise.all([
    getCandidateBanner(session.id),
    getCandidateProfileById(session.id),
    getJoinedPostingsForCandidate(session.id),
  ]);

  const resolvedSearchParams = await searchParams;
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const bannerStatus = bannerStatusFromParams(noticeCode, errorCode);
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const recommendations = candidateProfile?.recommendations ?? [];
  const experienceRows = candidateProfile
    ? buildExperienceRows(candidateProfile, recommendations)
    : [];

  return (
    <>
      <TopNav viewer={{ role: "candidate", fullName: session.fullName }} />
      <main className="mx-auto grid w-full max-w-[1240px] gap-7 px-6 py-7 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6 min-w-0">
          {noticeMessage ? (
            <div className="rounded-[var(--r-lg)] border border-[color:var(--verified-bg-2)] bg-[color:var(--verified-bg)] px-5 py-3 text-[13px] text-[color:var(--ink)]">
              {noticeMessage}
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-[var(--r-lg)] border border-[#fecaca] bg-[#fef2f2] px-5 py-3 text-[13px] text-[#b91c1c]">
              {errorMessage}
            </div>
          ) : null}

          <HeroCard
            fullName={session.fullName}
            initials={getInitials(session.fullName)}
            headline={candidateProfile?.headline}
            location={candidateProfile?.location}
            joinedLabel={candidateProfile ? `${candidateProfile.yearsExperience}+ yrs experience` : null}
            contactLinks={buildContactLinks(banner)}
          />
          <ExperienceList rows={experienceRows} recommendations={recommendations} />
        </div>
        <aside className="grid gap-4 content-start">
          <BannerEditorCard banner={banner} status={bannerStatus} />
          <JoinedGroupsCard postings={joinedPostings} />
          <AccountCard />
        </aside>
      </main>
    </>
  );
}
