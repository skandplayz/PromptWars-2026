import { DIFFICULTIES, type Profile } from "@/lib/schemas";

export function EntryView({
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
