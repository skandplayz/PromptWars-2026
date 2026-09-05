import { type Project } from "@/lib/schemas";
import { ClockIcon, toneClass } from "./shared";

export function ProjectRow({
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
