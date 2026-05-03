"use client";

import { useState } from "react";
import type { RecommendationProject, RecommendationRequest } from "../server/recommendation-db";

type Props = { rec: RecommendationRequest };

type SaveState = "idle" | "saving" | "saved" | "error";
type SubmitState = "idle" | "confirming" | "submitting" | "error";
type DeleteState = "idle" | "confirming" | "deleting";

const MAX_PROJECTS = 2;

function newProject(): RecommendationProject {
  return { id: crypto.randomUUID(), title: "", description: "", skills: [] };
}

// ── Tag input ──────────────────────────────────────────────────────────────

function TagInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add(raw: string) {
    const tag = raw.trim().replace(/,$/, "");
    if (tag && !skills.includes(tag)) onChange([...skills, tag]);
    setInput("");
  }

  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {skills.map((s) => (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-[color:var(--verified-bg)] px-2 py-0.5 text-xs font-medium text-[color:var(--verified)]"
            key={s}
          >
            {s}
            <button
              className="opacity-60 hover:opacity-100"
              onClick={() => onChange(skills.filter((x) => x !== s))}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="w-full bg-transparent text-sm text-[color:var(--ink)] outline-none placeholder:text-[color:var(--ink-4)]"
        onBlur={() => { if (input.trim()) add(input); }}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(input);
          } else if (e.key === "Backspace" && !input) {
            onChange(skills.slice(0, -1));
          }
        }}
        placeholder="e.g. Python, React, AWS — press Enter to add"
        type="text"
        value={input}
      />
    </div>
  );
}

// ── Textarea ───────────────────────────────────────────────────────────────

function Textarea({
  value,
  onChange,
  placeholder,
  minRows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minRows?: number;
}) {
  return (
    <textarea
      className="mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)] resize-none"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      value={value}
    />
  );
}

// ── Section card ───────────────────────────────────────────────────────────

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] shadow-sm backdrop-blur-sm">
      <div className="border-b border-[color:var(--hairline)] px-5 py-4">
        <h2 className="font-semibold text-[color:var(--ink)]">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-[color:var(--ink-3)]">{hint}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────

export function RecommendationForm({ rec: initial }: Props) {
  const isExpired = new Date(initial.expiresAt) < new Date();

  const [status, setStatus] = useState(initial.status);
  const [technical, setTechnical] = useState(initial.technicalResponse);
  const [behavioral, setBehavioral] = useState(initial.behavioralResponse);
  const [projects, setProjects] = useState<RecommendationProject[]>(
    initial.projects.length > 0 ? initial.projects : [],
  );

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [deleteState, setDeleteState] = useState<DeleteState>("idle");

  function getPayload() {
    return { technicalResponse: technical, behavioralResponse: behavioral, projects };
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/recommend/${initial.token}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      setSaveState(res.ok ? "saved" : "error");
      if (res.ok) {
        setStatus("draft");
        setTimeout(() => setSaveState("idle"), 2500);
      }
    } catch {
      setSaveState("error");
    }
  }

  async function handleSubmit() {
    setSubmitState("submitting");
    try {
      const res = await fetch(`/api/recommend/${initial.token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      if (res.ok) {
        setStatus("submitted");
        setSubmitState("idle");
      } else {
        setSubmitState("error");
      }
    } catch {
      setSubmitState("error");
    }
  }

  async function handleDelete() {
    setDeleteState("deleting");
    try {
      const res = await fetch(`/api/recommend/${initial.token}/delete`, { method: "POST" });
      if (res.ok) setStatus("deleted");
      else setDeleteState("idle");
    } catch {
      setDeleteState("idle");
    }
  }

  function updateProject(id: string, patch: Partial<RecommendationProject>) {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  // ── Terminal states ──────────────────────────────────────────────────────

  if (status === "deleted") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-semibold text-[color:var(--ink)]">Recommendation removed</p>
        <p className="text-sm text-[color:var(--ink-3)]">
          This recommendation has been deleted and is no longer visible.
        </p>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-6 py-10">
        <div className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] shadow-sm backdrop-blur-sm p-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--verified-bg)] text-2xl text-[color:var(--verified)]">
            ✓
          </div>
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">Recommendation submitted</h2>
          <p className="mt-1 text-sm text-[color:var(--ink-3)]">
            Your recommendation for <strong>{initial.candidateName}</strong> has been recorded.
            Thank you.
          </p>
        </div>

        <div className="rounded-2xl border border-red-100 bg-[color:var(--surface)] shadow-sm backdrop-blur-sm p-5">
          <p className="text-sm font-medium text-[color:var(--ink)] mb-1">Remove this recommendation</p>
          <p className="text-sm text-[color:var(--ink-3)] mb-4">
            If you'd like your recommendation to be removed from {initial.candidateName}'s profile,
            you can delete it here. This cannot be undone.
          </p>
          {deleteState === "confirming" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[color:var(--ink-3)]">Are you sure? This is permanent.</span>
              <button
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                onClick={handleDelete}
                type="button"
              >
                Yes, delete
              </button>
              <button
                className="text-sm text-[color:var(--ink-3)] hover:text-[color:var(--ink)]"
                onClick={() => setDeleteState("idle")}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              disabled={deleteState === "deleting"}
              onClick={() => setDeleteState("confirming")}
              type="button"
            >
              {deleteState === "deleting" ? "Deleting…" : "Delete recommendation"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-semibold text-[color:var(--ink)]">This link has expired</p>
        <p className="text-sm text-[color:var(--ink-3)]">
          Recommendation links are valid for 7 days. Please ask {initial.candidateName} to send a
          new request.
        </p>
      </div>
    );
  }

  // ── Active form ──────────────────────────────────────────────────────────

  const name = initial.candidateName;

  return (
    <div className="flex flex-col gap-6">
      {/* Context */}
      {(initial.recommenderName || initial.relationship || initial.candidateContext) && (
        <Card title="About this request">
          <div className="flex flex-col gap-2 text-sm">
            {initial.recommenderName && (
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--ink-3)] w-24 shrink-0">Your name</span>
                <span className="font-medium text-[color:var(--ink)]">
                  {initial.recommenderName}
                  {initial.recommenderTitle ? ` · ${initial.recommenderTitle}` : ""}
                  {initial.verifiedCompany ? `, ${initial.verifiedCompany}` : ""}
                </span>
              </div>
            )}
            {initial.relationship && (
              <div className="flex items-center gap-2">
                <span className="text-[color:var(--ink-3)] w-24 shrink-0">Relationship</span>
                <span className="font-medium text-[color:var(--ink)]">{initial.relationship}</span>
              </div>
            )}
            {initial.candidateContext && (
              <div className="mt-1 rounded-xl bg-[color:var(--verified-bg)] border border-[color:var(--hairline)] px-4 py-3">
                <p className="text-[color:var(--ink-3)] italic">"{initial.candidateContext}"</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Technical */}
      <Card
        title="Technical Assessment"
        hint={`What technical problems did ${name} solve? How deep was their technical understanding, and how strong were their engineering decisions and code quality?`}
      >
        <Textarea
          onChange={setTechnical}
          placeholder={`Describe ${name}'s technical abilities in as much detail as you can. Consider: What technical problems did they tackle? What was the quality of their work? How did they approach complexity?`}
          value={technical}
        />
      </Card>

      {/* Behavioral */}
      <Card
        title="Working Style & Impact"
        hint={`How did ${name} collaborate, communicate, and show up for their team? Consider ownership, reliability, and interpersonal impact.`}
      >
        <Textarea
          onChange={setBehavioral}
          placeholder={`Describe how ${name} worked. Consider: How did they handle ownership or ambiguity? How did they communicate across the team? What was their impact on the people around them?`}
          value={behavioral}
        />
      </Card>

      {/* Projects */}
      <Card
        title="Projects"
        hint={`Add up to ${MAX_PROJECTS} projects you can speak to specifically. Be as concrete as possible about what ${name} personally contributed.`}
      >
        <div className="flex flex-col gap-5">
          {projects.map((project, idx) => (
            <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] p-4" key={project.id}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[color:var(--ink)]">Project {idx + 1}</span>
                <button
                  className="text-xs text-[color:var(--ink-3)] hover:text-red-500 transition"
                  onClick={() => setProjects((ps) => ps.filter((p) => p.id !== project.id))}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  className="mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]"
                  onChange={(e) => updateProject(project.id, { title: e.target.value })}
                  placeholder="Project name"
                  type="text"
                  value={project.title}
                />
                <Textarea
                  minRows={3}
                  onChange={(v) => updateProject(project.id, { description: v })}
                  placeholder={`What was this project about, and what did ${name} specifically contribute?`}
                  value={project.description}
                />
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[color:var(--ink-3)]">
                    Skills & technologies used
                  </label>
                  <TagInput
                    onChange={(skills) => updateProject(project.id, { skills })}
                    skills={project.skills}
                  />
                </div>
              </div>
            </div>
          ))}

          {projects.length < MAX_PROJECTS && (
            <button
              className="flex items-center gap-2 rounded-xl border border-dashed border-[color:var(--hairline)] px-4 py-3 text-sm text-[color:var(--ink-3)] transition hover:border-[color:var(--verified)] hover:text-[color:var(--verified)]"
              onClick={() => setProjects((ps) => [...ps, newProject()])}
              type="button"
            >
              <span className="text-lg leading-none">+</span>
              Add a project
            </button>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--surface)] shadow-sm backdrop-blur-sm px-5 py-4">
        <div className="flex items-center gap-3">
          {saveState === "saved" && (
            <span className="text-sm text-[color:var(--verified)]">Draft saved</span>
          )}
          {saveState === "error" && (
            <span className="text-sm text-red-500">Save failed</span>
          )}
          {status === "draft" && saveState === "idle" && (
            <span className="text-xs text-[color:var(--ink-3)]">Draft in progress</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)] disabled:opacity-50"
            disabled={saveState === "saving"}
            onClick={handleSave}
            type="button"
          >
            {saveState === "saving" ? "Saving…" : "Save for later"}
          </button>

          {submitState === "confirming" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--ink-3)]">Submit and lock this response?</span>
              <button
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--verified)] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                onClick={handleSubmit}
                type="button"
              >
                Yes, submit
              </button>
              <button
                className="text-sm text-[color:var(--ink-3)] hover:text-[color:var(--ink)]"
                onClick={() => setSubmitState("idle")}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--verified)] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)] disabled:opacity-50"
              disabled={submitState === "submitting"}
              onClick={() => setSubmitState("confirming")}
              type="button"
            >
              {submitState === "submitting" ? "Submitting…" : "Submit recommendation"}
            </button>
          )}

          {submitState === "error" && (
            <span className="text-sm text-red-500">Submission failed</span>
          )}
        </div>
      </div>
    </div>
  );
}
