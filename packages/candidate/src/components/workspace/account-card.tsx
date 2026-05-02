import { Card, CardHead, CardPad } from "@recai/shared";
import { CandidateSignOutForm } from "../candidate-sign-out-form";

export function AccountCard() {
  return (
    <Card>
      <CardHead eyebrow="Account" />
      <CardPad>
        <p className="text-[13px] text-[color:var(--ink-3)]">
          Sign out of the candidate workspace.
        </p>
        <div className="mt-4">
          <CandidateSignOutForm className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]" />
        </div>
      </CardPad>
    </Card>
  );
}
