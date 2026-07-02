const languages = [
  "JavaScript", "TypeScript", "Python", "Go", "Rust", "Java",
  "C++", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
];

export function LanguagesSection() {
  return (
    <section className="border-t border-border py-16" aria-labelledby="languages-heading">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
        <h2 id="languages-heading" className="text-lg font-semibold">50+ languages supported</h2>
        <p className="mt-1 text-sm text-muted-foreground">From web frameworks to systems programming.</p>
        <div className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Supported languages">
          {languages.map((lang) => (
            <span key={lang} className="px-2.5 py-1 text-xs font-mono text-muted-foreground border border-border rounded-sm" role="listitem">
              {lang}
            </span>
          ))}
          <span className="px-2.5 py-1 text-xs font-mono text-muted-foreground/50 border border-dashed border-border rounded-sm">
            +40 more
          </span>
        </div>
      </div>
    </section>
  );
}
