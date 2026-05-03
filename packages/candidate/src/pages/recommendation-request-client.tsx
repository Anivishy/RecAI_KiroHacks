"use client";

import { useState } from "react";
import type { RecommendationRequest } from "../server/recommendation-db";
import { RecommendationForm } from "../components/recommendation-form";
import { RecommenderVerificationGate } from "../components/recommender-verification-gate";

type Props = {
  rec: RecommendationRequest;
  initialOtpPending: boolean;
};

export function RecommendationRequestClient({ rec, initialOtpPending }: Props) {
  const [verificationStatus, setVerificationStatus] = useState(rec.verificationStatus);
  const [verifiedDomain, setVerifiedDomain] = useState(rec.verifiedDomain);
  const [verifiedCompany, setVerifiedCompany] = useState(rec.verifiedCompany);

  if (verificationStatus !== "verified") {
    return (
      <RecommenderVerificationGate
        token={rec.token}
        initialStatus={verificationStatus}
        initialVerifiedDomain={verifiedDomain}
        initialVerifiedCompany={verifiedCompany}
        initialOtpPending={initialOtpPending}
        onVerified={({ verifiedDomain: d, verifiedCompany: c }) => {
          setVerifiedDomain(d);
          setVerifiedCompany(c);
          setVerificationStatus("verified");
        }}
      />
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm">
        <span className="font-medium text-foreground">Verified at </span>
        <strong>{verifiedCompany ?? "(unknown)"}</strong>
        {verifiedDomain ? (
          <span className="text-(--muted)"> &mdash; {verifiedDomain}</span>
        ) : null}
      </div>
      <RecommendationForm rec={{ ...rec, verifiedDomain, verifiedCompany }} />
    </>
  );
}
