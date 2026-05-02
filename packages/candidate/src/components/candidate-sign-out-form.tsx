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
          "rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
