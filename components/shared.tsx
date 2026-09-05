// Difficulty is free-form AI text; map it to a tone by keyword.
export function toneClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d.includes("advanced") || d.includes("hard")) return "advanced";
  if (d.includes("beginner") || d.includes("easy")) return "beginner";
  if (d.includes("intermediate") || d.includes("medium")) return "intermediate";
  return "neutral";
}

export function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
