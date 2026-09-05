"use client";

import { useState } from "react";
import {
  DIFFICULTIES,
  REFINEMENTS,
  type Blueprint,
  type Project,
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

// Difficulty is free-form AI text; map it to a tone by keyword.
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
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");

  const selectedProject =
    projects != null && selectedIndex != null ? projects[selectedIndex] : null;

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  // Single Gemini request: returns three complete projects (selection data + blueprint).
  async function generateProjects(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProjects(null);
    setSelectedIndex(null);
    setLoadingProjects(true);
    try {
      const data = await postJson<{ projects: Project[] }>("/api/ideas", profile);
      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate projects.");
    } finally {
      setLoadingProjects(false);
    }
  }

  // Local state only — the blueprint is already generated. No network request.
  function selectProject(index: number) {
    setError("");
    setSelectedIndex(index);
    window.scrollTo({ top: 0 });
  }

  // Optional. Refine calls Gemini; on failure the existing blueprint is preserved.
  async function refine(refinement: (typeof REFINEMENTS)[number]) {
    if (selectedIndex == null || !projects) return;
    const current = projects[selectedIndex];
    setError("");
    setRefining(true);
    try {
      const updated = await postJson<Blueprint>("/api/refine", {
        blueprint: current.blueprint,
        refinement,
      });
      setProjects((prev) => {
        if (!prev) return prev;
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], blueprint: updated };
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refine the blueprint.");
    } finally {
      setRefining(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">P</span>
          ProjectMentor
        </span>
        <span className="brand-tag">Final-year project mentor</span>
      </header>

      <main id="main" className={`wrap ${selectedProject || projects ? "wide" : "narrow"}`}>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        {selectedProject ? (
          <BlueprintView
            project={selectedProject}
            refining={refining}
            onRefine={refine}
            onBack={() => setSelectedIndex(null)}
          />
        ) : (
          <>
            <EntryView
              profile={profile}
              set={set}
              onSubmit={generateProjects}
              loading={loadingProjects}
              hasProjects={!!projects}
            />

            {loadingProjects && <ProjectsSkeleton />}

            {projects && !loadingProjects && (
              <section className="view" aria-labelledby="ideas-heading" style={{ marginTop: "2.75rem" }}>
                <div className="section-head">
                  <div>
                    <h2 id="ideas-heading">Three projects for you</h2>
                    <p className="sub">Chosen for your skills, time, and budget. Open one to see its full blueprint.</p>
                  </div>
                </div>
                <ol className="project-list">
                  {projects.map((p, i) => (
                    <ProjectRow key={i} index={i} project={p} onSelect={() => selectProject(i)} />
                  ))}
                </ol>
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
  hasProjects,
}: {
  profile: Profile;
  set: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  hasProjects: boolean;
}) {
  return (
    <div className="view">
      <div className="hero">
        <span className="eyebrow">AI project mentor</span>
        <h1>Turn your skills into a project worth building.</h1>
        <p className="lede">
          Tell us what you know and what you&apos;re into. We&apos;ll suggest three final-year projects
          that fit your time and budget — then hand you a plan to build the one you pick.
        </p>
        <ul className="steps">
          <li><b>1</b> Describe yourself</li>
          <li><b>2</b> Choose your project</li>
          <li><b>3</b> Build with a plan</li>
        </ul>
      </div>

      <form className="panel" onSubmit={onSubmit}>
        <div className="panel-head">
          <h2>Your profile</h2>
          <p>The more specific you are, the sharper the projects.</p>
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
            Available time / constraints <span className="hint">— optional</span>
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
            ) : hasProjects ? (
              "Regenerate projects"
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

function ProjectRow({
  index,
  project,
  onSelect,
}: {
  index: number;
  project: Project;
  onSelect: () => void;
}) {
  const tech = project.techStack.slice(0, 4);
  const extraTech = project.techStack.length - tech.length;
  const features = project.coreFeatures.slice(0, 3);

  return (
    <li className="project-row">
      <div className="project-index" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="project-body">
        <div className="project-top">
          <h3>{project.title}</h3>
          <div className="meta-row">
            <span className={`pill ${toneClass(project.difficulty)}`}>
              <span className="dot" aria-hidden="true" />
              {project.difficulty}
            </span>
            <span className="meta">
              <ClockIcon />
              {project.estimatedTimeline}
            </span>
          </div>
        </div>
        <p className="project-desc">{project.shortDescription}</p>
        <div className="chips" aria-label="Tech stack">
          {tech.map((t, i) => (
            <span className="chip" key={i}>
              {t}
            </span>
          ))}
          {extraTech > 0 && <span className="chip more">+{extraTech}</span>}
        </div>
        <ul className="feature-inline">
          {features.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
        <button className="btn" onClick={onSelect}>
          View project →
        </button>
      </div>
    </li>
  );
}

function ProjectsSkeleton() {
  return (
    <section aria-hidden="true" style={{ marginTop: "2.75rem" }}>
      <div className="project-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div className="skeleton" key={i} style={{ height: "180px" }}>
            <div className="sk-line" style={{ width: "55%", height: "18px" }} />
            <div className="sk-line" style={{ width: "85%", marginTop: "1rem" }} />
            <div className="sk-line" style={{ width: "70%" }} />
            <div className="sk-line" style={{ width: "40%", marginTop: "1.2rem", height: "38px" }} />
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

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="block">
      <h3>{title}</h3>
      <ul className="block-list">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function BlueprintView({
  project,
  onRefine,
  onBack,
  refining,
}: {
  project: Project;
  onRefine: (r: (typeof REFINEMENTS)[number]) => void;
  onBack: () => void;
  refining: boolean;
}) {
  const bp = project.blueprint;
  return (
    <div className="view" aria-labelledby="plan-heading">
      <div className="plan-back">
        <button className="btn ghost" onClick={onBack}>
          ← Back to projects
        </button>
      </div>

      {/* PROJECT OVERVIEW */}
      <div className="plan-hero">
        <span className="eyebrow">Project blueprint</span>
        <h2 id="plan-heading">{project.title}</h2>
        <p className="plan-note">Built around your skills and constraints.</p>
        <div className="plan-stats" aria-label="Project overview">
          <span className={`pill ${toneClass(project.difficulty)}`}>
            <span className="dot" aria-hidden="true" />
            {project.difficulty}
          </span>
          <span className="stat">
            <ClockIcon />
            {bp.estimatedTimeline}
          </span>
          <span className="stat">
            <b>{bp.techStack.length}</b> technologies
          </span>
          <span className="stat">
            <b>{bp.developmentRoadmap.length}</b> build stages
          </span>
        </div>
      </div>

      <div className="plan-layout">
        <div className="plan-main">
          <Block title="The problem" text={bp.problemStatement} />
          <Block title="The solution" text={bp.solution} />
          <Block title="Why it fits you" text={bp.whyThisProject} />
          <ListBlock title="Core features" items={bp.features} />

          <section className="block">
            <h3>Tech stack</h3>
            <div className="chips" aria-label="Technology stack">
              {bp.techStack.map((t, i) => (
                <span className="chip" key={i}>
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="block">
            <h3>Build roadmap</h3>
            <ol className="roadmap">
              {bp.developmentRoadmap.map((step, i) => (
                <li key={i}>
                  <span className="roadmap-stage">Stage {i + 1}</span>
                  <span className="roadmap-text">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <ListBlock title="Testing strategy" items={bp.testingStrategy} />
          <ListBlock title="Future scope" items={bp.futureScope} />
        </div>

        <aside className="plan-rail">
          <div className="rail-card">
            <h3>Project facts</h3>
            <div className="rail-facts">
              <div className="rail-fact">
                <span className="k">Difficulty</span>
                <span>
                  <span className={`pill ${toneClass(project.difficulty)}`}>
                    <span className="dot" aria-hidden="true" />
                    {project.difficulty}
                  </span>
                </span>
              </div>
              <div className="rail-fact">
                <span className="k">Estimated timeline</span>
                <span className="meta-row">
                  <span className="meta">
                    <ClockIcon />
                    {bp.estimatedTimeline}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="rail-card rail-refine">
            <h3>Refine your project</h3>
            <p>Optional — regenerate the blueprint against a new constraint.</p>
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
