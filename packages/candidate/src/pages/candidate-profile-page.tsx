import { notFound } from "next/navigation";
import {
  HowRecAIScores,
  RelationMix,
  TopNav,
  TrustCard,
  VerifiedDomains,
  buildExperienceRows,
  buildRelationMix,
  buildTrustStats,
} from "@recai/shared";
import { ExperienceList } from "../components/profile/experience-list";
import { HeroCard, type HeroLink } from "../components/profile/hero-card";
import { getCandidateProfileBySlug } from "../server/candidate-profile-db";

type CandidateProfilePageProps = {
  params: Promise<{ candidateSlug: string }>;
};

function getInitials(fullName: string): string {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export async function CandidateProfilePage({ params }: CandidateProfilePageProps) {
  const { candidateSlug } = await params;
  const candidate = await getCandidateProfileBySlug(candidateSlug);
  if (!candidate) notFound();

  const experienceRows = buildExperienceRows(candidate, candidate.recommendations);
  const trustStats = buildTrustStats(candidate.recommendations);
  const relationMix = buildRelationMix(candidate.recommendations);
  const contactLinks: HeroLink[] = [];

  return (
    <>
      <TopNav viewer={{ role: "guest" }} />
      <main className="mx-auto grid w-full max-w-[1240px] gap-7 px-6 py-7 pb-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6 min-w-0">
          <HeroCard
            fullName={candidate.fullName}
            initials={getInitials(candidate.fullName)}
            headline={candidate.headline}
            location={candidate.location}
            joinedLabel={`${candidate.yearsExperience}+ yrs experience`}
            contactLinks={contactLinks}
          />
          <ExperienceList rows={experienceRows} recommendations={candidate.recommendations} />
        </div>
        <aside className="grid gap-4 content-start">
          <TrustCard stats={trustStats} />
          <RelationMix entries={relationMix} />
          <VerifiedDomains domains={trustStats.domains} />
          <HowRecAIScores />
        </aside>
      </main>
    </>
  );
}
