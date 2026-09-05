"use client";

import { useState } from "react";
import {
  DIFFICULTIES,
  REFINEMENTS,
  type Idea,
  type Plan,
  type Profile,
} from "@/lib/schemas";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Request failed. Please try again.");
  return data as T;
}

const EMPTY_PROFILE: Profile = {
  interests: "",
  skills: "",
  domain: "",
  difficulty: "Intermediate",
  constraints: "",
};

// Idea difficulty is free-form AI text; map it to a tone by keyword.
function toneClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d.includes("advanced") || d.includes("hard")) return "advanced";
  if (d.includes("beginner") || d.includes("easy")) return "beginner";
  if (d.includes("intermediate") || d.includes("medium")) return "intermediate";
  return "neutral";
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);

  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function generateIdeas(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIdeas(null);
    setPlan(null);
    setLoadingIdeas(true);
    try {
      const data = await postJson<{ ideas: Idea[] }>("/api/ideas", profile);
      setIdeas(data.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate ideas.");
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function selectIdea(idea: Idea) {
    setError("");
    setLoadingPlan(true);
    setPlan(null);
    try {
      const data = await postJson<Plan>("/api/plan", idea);
      setPlan(data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build plan.");
    } finally {
      setLoadingPlan(false);
    }
  }

  async function refine(refinement: (typeof REFINEMENTS)[number]) {
    if (!plan) return;
    setError("");
    setRefining(true);
    try {
      const data = await postJson<Plan>("/api/refine", { plan, refinement });
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refine plan.");
    } finally {
      setRefining(false);
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">P</span>
          ProjectMentor
        </span>
        <span className="brand-tag">Final-year project mentor</span>
      </header>

      <main className={`wrap ${plan ? "wide" : ideas ? "wide" : "narrow"}`}>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {plan ? (
          <PlanView plan={plan} refining={refining} onRefine={refine} onBack={() => setPlan(null)} />
        ) : (
          <>
            <EntryView
              profile={profile}
              set={set}
              onSubmit={generateIdeas}
              loading={loadingIdeas}
              hasIdeas={!!ideas}
            />

            {loadingIdeas && <IdeasSkeleton />}

            {ideas && !loadingIdeas && (
              <section className="view" aria-labelledby="ideas-heading" style={{ marginTop: "2.75rem" }}>
                <div className="section-head">
                  <div>
                    <h2 id="ideas-heading">Tailored ideas</h2>
                    <p className="sub">{ideas.length} projects matched to your profile. Pick one to get a full plan.</p>
                  </div>
                </div>

                {loadingPlan && (
                  <div className="statusbar" role="status">
                    <span className="spinner" aria-hidden="true" /> Building your mentorship plan…
                  </div>
                )}

                <div className="ideas-grid">
                  {ideas.map((idea, i) => (
                    <IdeaCard key={i} idea={idea} disabled={loadingPlan} onSelect={() => selectIdea(idea)} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function EntryView({
  profile,
  set,
  onSubmit,
  loading,
  hasIdeas,
}: {
  profile: Profile;
  set: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  hasIdeas: boolean;
}) {
  return (
    <div className="view">
      <div className="hero">
        <span className="eyebrow">AI project mentor</span>
        <h1>Turn your skills into a project worth building.</h1>
        <p className="lede">
          Tell us what you know and what you&apos;re into. We&apos;ll suggest final-year projects
          that fit your time and budget — then hand you a plan to build the one you pick.
        </p>
        <ul className="steps">
          <li><b>1</b> Describe yourself</li>
          <li><b>2</b> Compare ideas</li>
          <li><b>3</b> Build with a plan</li>
        </ul>
      </div>

      <form className="panel" onSubmit={onSubmit}>
        <div className="panel-head">
          <h2>Your profile</h2>
          <p>The more specific you are, the sharper the ideas.</p>
        </div>

        <div className="field">
          <label htmlFor="interests">
            Interests <span className="hint">— what excites you?</span>
          </label>
          <textarea
            id="interests"
            required
            maxLength={500}
            placeholder="e.g. healthcare, machine learning, sustainability"
            value={profile.interests}
            onChange={(e) => set("interests", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="skills">
            Current skills <span className="hint">— languages, tools, frameworks</span>
          </label>
          <textarea
            id="skills"
            required
            maxLength={500}
            placeholder="e.g. Python, React, basic SQL, some ML"
            value={profile.skills}
            onChange={(e) => set("skills", e.target.value)}
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="domain">Preferred domain</label>
            <input
              id="domain"
              required
              maxLength={120}
              placeholder="e.g. Web, Mobile, IoT, Data Science"
              value={profile.domain}
              onChange={(e) => set("domain", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={profile.difficulty}
              onChange={(e) => set("difficulty", e.target.value as Profile["difficulty"])}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="constraints">
            Time / constraints <span className="hint">— optional</span>
          </label>
          <input
            id="constraints"
            maxLength={500}
            placeholder="e.g. 3 months, solo, low budget, no paid APIs"
            value={profile.constraints}
            onChange={(e) => set("constraints", e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Generating…
              </>
            ) : hasIdeas ? (
              "Regenerate project ideas"
            ) : (
              "Generate project ideas"
            )}
          </button>
          <span className="note">Free to explore. No account needed.</span>
        </div>
      </form>
    </div>
  );
}

function IdeaCard({
  idea,
  onSelect,
  disabled,
}: {
  idea: Idea;
  onSelect: () => void;
  disabled: boolean;
}) {
  const shownFeatures = idea.coreFeatures.slice(0, 4);
  const extraFeatures = idea.coreFeatures.length - shownFeatures.length;
  const shownTech = idea.techStack.slice(0, 6);
  const extraTech = idea.techStack.length - shownTech.length;

  return (
    <article className="idea">
      <div className="idea-top">
        <h3>{idea.title}</h3>
        <div className="meta-row">
          <span className={`pill ${toneClass(idea.difficulty)}`}>
            <span className="dot" aria-hidden="true" />
            {idea.difficulty}
          </span>
          <span className="meta">
            <ClockIcon />
            {idea.estimatedTimeline}
          </span>
        </div>
      </div>

      <p className="idea-lead">{idea.solution}</p>

      <p className="idea-note">
        <b>Solves:</b> {idea.problem}
      </p>

      <div className="idea-block">
        <div className="block-label">Tech stack</div>
        <div className="chips" aria-label="Tech stack">
          {shownTech.map((t, i) => (
            <span className="chip" key={i}>
              {t}
            </span>
          ))}
          {extraTech > 0 && <span className="chip more">+{extraTech}</span>}
        </div>
      </div>

      <div className="idea-block">
        <div className="block-label">Core features</div>
        <ul className="feature-list">
          {shownFeatures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
          {extraFeatures > 0 && <li className="muted">+{extraFeatures} more feature{extraFeatures > 1 ? "s" : ""}</li>}
        </ul>
      </div>

      <p className="why">
        <b>Why this fits you.</b> {idea.whyItFits}
      </p>

      <div className="idea-cta">
        <button className="btn full" onClick={onSelect} disabled={disabled}>
          Get mentorship plan
        </button>
      </div>
    </article>
  );
}

function IdeasSkeleton() {
  return (
    <section aria-hidden="true" style={{ marginTop: "2.75rem" }}>
      <div className="ideas-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="skeleton" key={i}>
            <div className="sk-line" style={{ width: "70%", height: "18px" }} />
            <div className="sk-line" style={{ width: "40%" }} />
            <div className="sk-line" style={{ width: "100%", marginTop: "1rem" }} />
            <div className="sk-line" style={{ width: "90%" }} />
            <div className="sk-line" style={{ width: "60%", marginTop: "1.5rem" }} />
            <div className="sk-line" style={{ width: "100%", marginTop: "1.5rem", height: "40px" }} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <section className="block">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function ListBlock({ title, items, extraClass = "" }: { title: string; items: string[]; extraClass?: string }) {
  return (
    <section className={`block ${extraClass}`}>
      <h3>{title}</h3>
      <ul className="block-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PlanView({
  plan,
  onRefine,
  onBack,
  refining,
}: {
  plan: Plan;
  onRefine: (r: (typeof REFINEMENTS)[number]) => void;
  onBack: () => void;
  refining: boolean;
}) {
  return (
    <div className="view" aria-labelledby="plan-heading">
      <div className="plan-head">
        <div className="plan-back">
          <button className="btn ghost" onClick={onBack}>
            ← Back to ideas
          </button>
        </div>
        <span className="eyebrow">Project blueprint</span>
        <h2 id="plan-heading">{plan.projectTitle}</h2>
        <div className="meta-row">
          <span className="meta">
            <ClockIcon />
            {plan.estimatedTimeline}
          </span>
        </div>
      </div>

      <div className="plan-layout">
        <div className="plan-main">
          <Block title="Problem statement" text={plan.problemStatement} />
          <Block title="Proposed solution" text={plan.solution} />
          <Block title="Why this project fits you" text={plan.whyThisProject} />
          <ListBlock title="Core features" items={plan.features} />

          <section className="block">
            <h3>Development roadmap</h3>
            <ol className="roadmap">
              {plan.developmentRoadmap.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>

          <ListBlock title="Testing strategy" items={plan.testingStrategy} />
          <ListBlock title="Future scope" items={plan.futureScope} />
        </div>

        <aside className="plan-rail">
          <div className="rail-card">
            <h3>At a glance</h3>
            <div className="rail-facts">
              <div className="rail-fact">
                <span className="k">Timeline</span>
                <span className="meta-row">
                  <span className="meta">
                    <ClockIcon />
                    {plan.estimatedTimeline}
                  </span>
                </span>
              </div>
              <div className="rail-fact">
                <span className="k">Tech stack</span>
                <div className="chips">
                  {plan.techStack.map((t, i) => (
                    <span className="chip" key={i}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rail-card rail-refine">
            <h3>Refine this plan</h3>
            <p>Regenerate the blueprint against a new constraint.</p>
            <div className="refine-actions" role="group" aria-label="Refinement options">
              {REFINEMENTS.map((r) => (
                <button key={r} className="btn secondary" onClick={() => onRefine(r)} disabled={refining}>
                  {r}
                </button>
              ))}
            </div>
            {refining && (
              <span className="refine-status" role="status">
                <span className="spinner" aria-hidden="true" /> Refining…
              </span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
