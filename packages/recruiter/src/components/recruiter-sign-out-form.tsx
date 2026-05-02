type RecruiterSignOutFormProps = {
  className?: string;
  label?: string;
  redirectTo?: string;
};

export function RecruiterSignOutForm({
  className,
  label = "Sign out",
  redirectTo = "/recruiter/sign-in",
}: RecruiterSignOutFormProps) {
  return (
    <form action="/api/recruiter/auth/sign-out" method="post">
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
