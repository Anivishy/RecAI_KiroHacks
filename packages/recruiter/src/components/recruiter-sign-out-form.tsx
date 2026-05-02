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
          "inline-flex items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
