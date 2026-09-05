export function ProjectsSkeleton() {
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
