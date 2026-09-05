import { REFINEMENTS, type Project } from "@/lib/schemas";
import { ClockIcon, toneClass } from "./shared";
import { Block, ListBlock } from "./Block";

export function BlueprintView({
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
