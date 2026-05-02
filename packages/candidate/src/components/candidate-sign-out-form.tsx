type CandidateSignOutFormProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
};

export function CandidateSignOutForm({
  className,
  label = "Sign out",
  redirectTo = "/candidate/sign-in",
}: CandidateSignOutFormProps) {
  return (
    <form action="/api/candidate/auth/sign-out" method="post">
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <button
        className={
          className ??
          "inline-flex items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
