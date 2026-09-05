"use client";

import { useState } from "react";
import {
  REFINEMENTS,
  type Blueprint,
  type Project,
  type Profile,
} from "@/lib/schemas";
import { EntryView } from "@/components/EntryView";
import { ProjectRow } from "@/components/ProjectRow";
import { ProjectsSkeleton } from "@/components/ProjectsSkeleton";
import { BlueprintView } from "@/components/BlueprintView";

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
