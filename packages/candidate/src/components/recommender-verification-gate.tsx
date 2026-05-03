"use client";

import { useState } from "react";

type VerificationStatus = "pending" | "email_verified" | "verified" | "company_pending";

type Props = {
  token: string;
  initialStatus: VerificationStatus;
  initialVerifiedDomain: string | null;
  initialVerifiedCompany: string | null;
  initialOtpPending: boolean;
  onVerified: (data: { verifiedDomain: string; verifiedCompany: string }) => void;
};

type Stage = "email" | "code" | "company_pending";

export function RecommenderVerificationGate({
  token,
  initialStatus,
  initialVerifiedDomain,
  initialOtpPending,
  onVerified,
}: Props) {
  const [stage, setStage] = useState<Stage>(() => {
    if (initialStatus === "company_pending" && !initialOtpPending) return "company_pending";
    if (initialOtpPending) return "code";
    return "email";
  });
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastDomain, setLastDomain] = useState<string | null>(initialVerifiedDomain);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommend/${token}/start-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === "personal_domain") {
          setError(`Please use a work email — ${json.domain} addresses aren't accepted.`);
        } else if (json?.error === "invalid_email") {
          setError("That doesn't look like a valid email.");
        } else if (json?.error === "send_failed") {
          setError("We couldn't send the code. Please try again.");
        } else if (json?.error === "link_expired") {
          setError("This recommendation link has expired.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }
      setStage("code");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/recommend/${token}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === "expired") setError("This code has expired. Request a new one.");
        else if (json?.error === "attempts_exhausted")
          setError("Too many attempts. Request a new code.");
        else if (json?.error === "mismatch") setError("Incorrect code. Try again.");
        else setError("Verification failed. Please try again.");
        return;
      }
      if (json.verificationStatus === "verified") {
        onVerified({
          verifiedDomain: json.verifiedDomain,
          verifiedCompany: json.verifiedCompany,
        });
        return;
      }
      if (json.verificationStatus === "company_pending") {
        setLastDomain(json.verifiedDomain ?? null);
        setStage("company_pending");
        return;
      }
      setError("Unexpected response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetToEmail() {
    setStage("email");
    setCode("");
    setError(null);
  }

  if (stage === "company_pending") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm space-y-3">
        <div className="font-medium text-foreground">Couldn't verify the company</div>
        <div className="text-(--muted)">
          We sent the code, but couldn't verify a company at{" "}
          <strong>{lastDomain ?? "that domain"}</strong>. Please try a different work email.
        </div>
        <button
          type="button"
          className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-xs font-medium hover:border-(--accent) hover:text-(--accent)"
          onClick={resetToEmail}
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (stage === "code") {
    return (
      <form
        onSubmit={handleVerify}
        className="rounded-2xl border border-(--line) bg-white/70 shadow-sm backdrop-blur-sm p-5 text-sm space-y-3"
      >
        <div className="font-medium text-foreground">Enter your verification code</div>
        <div className="text-(--muted)">
          We sent a 6-digit code to your work email. The code expires in 10 minutes.
        </div>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-xl border border-(--line) bg-white/90 px-3 py-2.5 font-mono text-base tracking-[0.4em] outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
          placeholder="123456"
          required
        />
        {error ? <div className="text-xs text-red-500">{error}</div> : null}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="h-9 rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-foreground disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify"}
          </button>
          <button
            type="button"
            onClick={resetToEmail}
            className="h-9 rounded-xl border border-(--line) bg-white px-4 text-sm font-medium text-(--muted) transition hover:border-(--accent) hover:text-(--accent)"
          >
            Change email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleStart}
      className="rounded-2xl border border-(--line) bg-white/70 shadow-sm backdrop-blur-sm p-5 text-sm space-y-3"
    >
      <div className="font-medium text-foreground">Verify your work email</div>
      <div className="text-(--muted)">
        Before writing a recommendation, please verify a work email at the company you're recommending
        from. We'll send a 6-digit code to confirm it's yours.
      </div>
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="w-full rounded-xl border border-(--line) bg-white/90 px-3 py-2.5 outline-none focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
        placeholder="you@company.com"
        required
      />
      {error ? <div className="text-xs text-red-500">{error}</div> : null}
      <button
        type="submit"
        disabled={submitting || !email}
        className="h-9 rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-foreground disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}
