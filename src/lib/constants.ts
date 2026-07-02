/** GitHub commit-status context name used for branch protection rules. */
export const GITHUB_STATUS_CHECK_CONTEXT = "devreview-ai/code-review";

/** Valid GitHub username regex (alphanumeric + hyphens, max 39 chars). */
export const GITHUB_OWNER_RE = /^[a-zA-Z0-9-]{1,39}$/;

/** Valid GitHub repository name regex (alphanumeric + hyphens/underscores/dots, max 100 chars). */
export const GITHUB_REPO_RE = /^[a-zA-Z0-9._-]{1,100}$/;

export type TimePeriod = "7d" | "30d" | "90d" | "6m" | "1y";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "6m": "Last 6 months",
  "1y": "Last year",
};

export const COLORS = {
  primary: "#3b82f6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#8b5cf6",
  dark: "#1e293b",
  muted: "#64748b",
};

export const BRANCH_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#6366f1",
  "#14b8a6",
];

export const PUSHER_EVENTS = {
  // Thread events
  THREAD_CREATED: "thread:created",
  THREAD_RESOLVED: "thread:resolved",
  THREAD_REOPENED: "thread:reopened",

  // Comment events
  COMMENT_ADDED: "comment:added",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",

  // Reaction events
  REACTION_UPDATED: "reaction:updated",

  // Approval events
  APPROVAL_SUBMITTED: "approval:submitted",

  // Assignment events
  ASSIGNMENT_UPDATED: "assignment:updated",

  // Presence / cursor events (client events)
  CLIENT_TYPING: "client-typing",
  CLIENT_CURSOR: "client-cursor",

  // User account events
  PLAN_UPDATED: "plan:updated",
} as const;

export const ANIMATION = {
  duration: { fast: 0.3, normal: 0.5, slow: 0.8, verySlow: 1.2 },
  delay: { small: 0.1, medium: 0.2, large: 0.4 },
  ease: {
    smooth: "power2.out",
    smoothIn: "power2.in",
    smoothInOut: "power2.inOut",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    sharp: "power3.out",
    sharpIn: "power3.in",
  },
  stagger: { small: 0.05, medium: 0.1, large: 0.2 },
  scrollTrigger: {
    start: "top 85%",
    end: "bottom 15%",
    toggleActions: "play none none reverse",
  },
} as const;

export const SEVERITY_COLORS = {
  red: {
    bg: "bg-red-500/8 dark:bg-red-500/10",
    border: "border-red-500/15 hover:border-red-500/30",
    icon: "text-red-500",
    text: "text-red-600 dark:text-red-400",
    glow: "shadow-red-500/5",
  },
  orange: {
    bg: "bg-orange-500/8 dark:bg-orange-500/10",
    border: "border-orange-500/15 hover:border-orange-500/30",
    icon: "text-orange-500",
    text: "text-orange-600 dark:text-orange-400",
    glow: "shadow-orange-500/5",
  },
  amber: {
    bg: "bg-amber-500/8 dark:bg-amber-500/10",
    border: "border-amber-500/15 hover:border-amber-500/30",
    icon: "text-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    glow: "shadow-amber-500/5",
  },
  slate: {
    bg: "bg-slate-500/8 dark:bg-slate-500/10",
    border: "border-slate-500/15 hover:border-slate-500/30",
    icon: "text-slate-400 dark:text-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    glow: "shadow-slate-500/5",
  },
  sky: {
    bg: "bg-sky-500/8 dark:bg-sky-500/10",
    border: "border-sky-500/15 hover:border-sky-500/30",
    icon: "text-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    glow: "shadow-sky-500/5",
  },
} as const;

export interface ReviewStatus {
  status: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED";
  label: string;
  color: string;
}

export const REVIEW_STATUS_CONFIG: Record<string, ReviewStatus> = {
  APPROVED: {
    status: "APPROVED",
    label: "Approved",
    color: "#10b981",
  },
  CHANGES_REQUESTED: {
    status: "CHANGES_REQUESTED",
    label: "Changes Requested",
    color: "#f59e0b",
  },
  COMMENTED: {
    status: "COMMENTED",
    label: "Commented",
    color: "#6366f1",
  },
};

const LANG_BLUE = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
const LANG_YELLOW = "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400";
const LANG_GREEN = "bg-green-500/15 text-green-600 dark:text-green-400";
const LANG_PURPLE = "bg-purple-500/15 text-purple-600 dark:text-purple-400";
const LANG_PINK = "bg-pink-500/15 text-pink-600 dark:text-pink-400";
const LANG_ORANGE = "bg-orange-500/15 text-orange-600 dark:text-orange-400";
const LANG_RED = "bg-red-500/15 text-red-600 dark:text-red-400";
const LANG_GRAY = "bg-gray-500/15 text-gray-600 dark:text-gray-400";
const LANG_CYAN = "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400";
const LANG_VIOLET = "bg-violet-500/15 text-violet-600 dark:text-violet-400";
const LANG_INDIGO = "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400";
const LANG_EMERALD = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
const LANG_AMBER = "bg-amber-500/15 text-amber-600 dark:text-amber-400";
const LANG_TEAL = "bg-teal-500/15 text-teal-600 dark:text-teal-400";
const LANG_ROSE = "bg-rose-500/15 text-rose-600 dark:text-rose-400";
const LANG_SKY = "bg-sky-500/15 text-sky-600 dark:text-sky-400";
const LANG_LIME = "bg-lime-500/15 text-lime-600 dark:text-lime-400";
const LANG_FUCHSIA = "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400";

export const LANGUAGE_MAP: Record<string, { lang: string; color: string }> = {
  ts: { lang: "TypeScript", color: LANG_BLUE },
  tsx: { lang: "TSX", color: LANG_BLUE },
  mts: { lang: "TypeScript", color: LANG_BLUE },
  cts: { lang: "TypeScript", color: LANG_BLUE },
  js: { lang: "JavaScript", color: LANG_YELLOW },
  jsx: { lang: "JSX", color: LANG_YELLOW },
  mjs: { lang: "JavaScript", color: LANG_YELLOW },
  cjs: { lang: "JavaScript", color: LANG_YELLOW },
  html: { lang: "HTML", color: LANG_ORANGE },
  htm: { lang: "HTML", color: LANG_ORANGE },
  css: { lang: "CSS", color: LANG_PURPLE },
  scss: { lang: "SCSS", color: LANG_PINK },
  sass: { lang: "Sass", color: LANG_PINK },
  less: { lang: "Less", color: LANG_INDIGO },
  styl: { lang: "Stylus", color: LANG_LIME },
  vue: { lang: "Vue", color: LANG_EMERALD },
  svelte: { lang: "Svelte", color: LANG_ORANGE },
  astro: { lang: "Astro", color: LANG_ORANGE },
  mdx: { lang: "MDX", color: LANG_YELLOW },
  wasm: { lang: "WebAssembly", color: LANG_VIOLET },
  py: { lang: "Python", color: LANG_GREEN },
  pyx: { lang: "Cython", color: LANG_GREEN },
  pyi: { lang: "Python Stub", color: LANG_GREEN },
  pyw: { lang: "Python", color: LANG_GREEN },
  ipynb: { lang: "Jupyter", color: LANG_ORANGE },
  java: { lang: "Java", color: LANG_RED },
  kt: { lang: "Kotlin", color: LANG_VIOLET },
  kts: { lang: "Kotlin Script", color: LANG_VIOLET },
  scala: { lang: "Scala", color: LANG_RED },
  groovy: { lang: "Groovy", color: LANG_TEAL },
  gradle: { lang: "Gradle", color: LANG_TEAL },
  clj: { lang: "Clojure", color: LANG_GREEN },
  cljs: { lang: "ClojureScript", color: LANG_GREEN },
  c: { lang: "C", color: LANG_BLUE },
  h: { lang: "C Header", color: LANG_BLUE },
  cpp: { lang: "C++", color: LANG_BLUE },
  cxx: { lang: "C++", color: LANG_BLUE },
  cc: { lang: "C++", color: LANG_BLUE },
  hpp: { lang: "C++ Header", color: LANG_BLUE },
  hxx: { lang: "C++ Header", color: LANG_BLUE },
  m: { lang: "Objective-C", color: LANG_BLUE },
  mm: { lang: "Objective-C++", color: LANG_BLUE },
  cs: { lang: "C#", color: LANG_VIOLET },
  csx: { lang: "C# Script", color: LANG_VIOLET },
  fs: { lang: "F#", color: LANG_SKY },
  fsx: { lang: "F# Script", color: LANG_SKY },
  vb: { lang: "VB.NET", color: LANG_BLUE },
  xaml: { lang: "XAML", color: LANG_BLUE },
  razor: { lang: "Razor", color: LANG_PURPLE },
  cshtml: { lang: "Razor", color: LANG_PURPLE },
  csproj: { lang: "MSBuild", color: LANG_VIOLET },
  sln: { lang: "Solution", color: LANG_VIOLET },
  go: { lang: "Go", color: LANG_CYAN },
  mod: { lang: "Go Module", color: LANG_CYAN },
  sum: { lang: "Go Sum", color: LANG_CYAN },
  templ: { lang: "Go Templ", color: LANG_CYAN },
  rs: { lang: "Rust", color: LANG_ORANGE },
  rb: { lang: "Ruby", color: LANG_RED },
  erb: { lang: "ERB", color: LANG_RED },
  rake: { lang: "Rake", color: LANG_RED },
  gemspec: { lang: "Gemspec", color: LANG_RED },
  php: { lang: "PHP", color: LANG_VIOLET },
  blade: { lang: "Blade", color: LANG_ROSE },
  twig: { lang: "Twig", color: LANG_GREEN },
  swift: { lang: "Swift", color: LANG_ORANGE },
  dart: { lang: "Dart", color: LANG_BLUE },
  sh: { lang: "Shell", color: LANG_GREEN },
  bash: { lang: "Bash", color: LANG_GREEN },
  zsh: { lang: "Zsh", color: LANG_GREEN },
  fish: { lang: "Fish", color: LANG_GREEN },
  ps1: { lang: "PowerShell", color: LANG_BLUE },
  psm1: { lang: "PowerShell", color: LANG_BLUE },
  psd1: { lang: "PowerShell", color: LANG_BLUE },
  bat: { lang: "Batch", color: LANG_GRAY },
  cmd: { lang: "Batch", color: LANG_GRAY },
  ex: { lang: "Elixir", color: LANG_VIOLET },
  exs: { lang: "Elixir", color: LANG_VIOLET },
  eex: { lang: "EEx", color: LANG_VIOLET },
  heex: { lang: "HEEx", color: LANG_VIOLET },
  leex: { lang: "LEEx", color: LANG_VIOLET },
  erl: { lang: "Erlang", color: LANG_RED },
  hrl: { lang: "Erlang", color: LANG_RED },
  hs: { lang: "Haskell", color: LANG_VIOLET },
  lhs: { lang: "Haskell", color: LANG_VIOLET },
  ml: { lang: "OCaml", color: LANG_ORANGE },
  mli: { lang: "OCaml", color: LANG_ORANGE },
  elm: { lang: "Elm", color: LANG_TEAL },
  lua: { lang: "Lua", color: LANG_BLUE },
  r: { lang: "R", color: LANG_BLUE },
  rmd: { lang: "R Markdown", color: LANG_BLUE },
  pl: { lang: "Perl", color: LANG_TEAL },
  pm: { lang: "Perl", color: LANG_TEAL },
  zig: { lang: "Zig", color: LANG_AMBER },
  nim: { lang: "Nim", color: LANG_YELLOW },
  v: { lang: "V", color: LANG_BLUE },
  cr: { lang: "Crystal", color: LANG_GRAY },
  jl: { lang: "Julia", color: LANG_VIOLET },
  sql: { lang: "SQL", color: LANG_BLUE },
  psql: { lang: "PostgreSQL", color: LANG_BLUE },
  prisma: { lang: "Prisma", color: LANG_INDIGO },
  json: { lang: "JSON", color: LANG_GRAY },
  jsonc: { lang: "JSONC", color: LANG_GRAY },
  json5: { lang: "JSON5", color: LANG_GRAY },
  yaml: { lang: "YAML", color: LANG_RED },
  yml: { lang: "YAML", color: LANG_RED },
  toml: { lang: "TOML", color: LANG_GRAY },
  ini: { lang: "INI", color: LANG_GRAY },
  cfg: { lang: "Config", color: LANG_GRAY },
  conf: { lang: "Config", color: LANG_GRAY },
  env: { lang: "Env", color: LANG_YELLOW },
  properties: { lang: "Properties", color: LANG_GRAY },
  xml: { lang: "XML", color: LANG_ORANGE },
  svg: { lang: "SVG", color: LANG_ORANGE },
  plist: { lang: "Plist", color: LANG_GRAY },
  csv: { lang: "CSV", color: LANG_GREEN },
  md: { lang: "Markdown", color: LANG_GRAY },
  markdown: { lang: "Markdown", color: LANG_GRAY },
  rst: { lang: "reStructuredText", color: LANG_GRAY },
  adoc: { lang: "AsciiDoc", color: LANG_GRAY },
  tex: { lang: "LaTeX", color: LANG_TEAL },
  latex: { lang: "LaTeX", color: LANG_TEAL },
  txt: { lang: "Text", color: LANG_GRAY },
  graphql: { lang: "GraphQL", color: LANG_PINK },
  gql: { lang: "GraphQL", color: LANG_PINK },
  proto: { lang: "Protobuf", color: LANG_GREEN },
  tf: { lang: "Terraform", color: LANG_VIOLET },
  hcl: { lang: "HCL", color: LANG_VIOLET },
  bicep: { lang: "Bicep", color: LANG_BLUE },
  nix: { lang: "Nix", color: LANG_SKY },
  xib: { lang: "Interface Builder", color: LANG_BLUE },
  storyboard: { lang: "Storyboard", color: LANG_BLUE },
  hbs: { lang: "Handlebars", color: LANG_ORANGE },
  handlebars: { lang: "Handlebars", color: LANG_ORANGE },
  mustache: { lang: "Mustache", color: LANG_ORANGE },
  ejs: { lang: "EJS", color: LANG_GREEN },
  pug: { lang: "Pug", color: LANG_AMBER },
  jade: { lang: "Jade", color: LANG_AMBER },
  njk: { lang: "Nunjucks", color: LANG_GREEN },
  liquid: { lang: "Liquid", color: LANG_TEAL },
  cmake: { lang: "CMake", color: LANG_RED },
  mk: { lang: "Makefile", color: LANG_GRAY },
  mak: { lang: "Makefile", color: LANG_GRAY },
  just: { lang: "Justfile", color: LANG_GRAY },
  snap: { lang: "Snapshot", color: LANG_GRAY },
  spec: { lang: "Spec", color: LANG_GREEN },
  lock: { lang: "Lock", color: LANG_GRAY },
  log: { lang: "Log", color: LANG_GRAY },
  diff: { lang: "Diff", color: LANG_AMBER },
  patch: { lang: "Patch", color: LANG_AMBER },
  sol: { lang: "Solidity", color: LANG_GRAY },
  vy: { lang: "Vyper", color: LANG_TEAL },
  wgsl: { lang: "WGSL", color: LANG_RED },
  glsl: { lang: "GLSL", color: LANG_GREEN },
  hlsl: { lang: "HLSL", color: LANG_GREEN },
};

export const BASENAME_MAP: Record<string, { lang: string; color: string }> = {
  dockerfile: { lang: "Docker", color: LANG_BLUE },
  "dockerfile.dev": { lang: "Docker", color: LANG_BLUE },
  "dockerfile.prod": { lang: "Docker", color: LANG_BLUE },
  "docker-compose.yml": { lang: "Docker Compose", color: LANG_BLUE },
  "docker-compose.yaml": { lang: "Docker Compose", color: LANG_BLUE },
  ".gitignore": { lang: "Git", color: LANG_ORANGE },
  ".gitattributes": { lang: "Git", color: LANG_ORANGE },
  ".gitmodules": { lang: "Git", color: LANG_ORANGE },
  ".editorconfig": { lang: "EditorConfig", color: LANG_GRAY },
  ".prettierrc": { lang: "Prettier", color: LANG_FUCHSIA },
  ".prettierignore": { lang: "Prettier", color: LANG_FUCHSIA },
  ".eslintrc": { lang: "ESLint", color: LANG_VIOLET },
  ".eslintignore": { lang: "ESLint", color: LANG_VIOLET },
  ".babelrc": { lang: "Babel", color: LANG_YELLOW },
  ".npmrc": { lang: "npm", color: LANG_RED },
  ".nvmrc": { lang: "nvm", color: LANG_GREEN },
  ".env": { lang: "Env", color: LANG_YELLOW },
  ".env.local": { lang: "Env", color: LANG_YELLOW },
  ".env.development": { lang: "Env", color: LANG_YELLOW },
  ".env.production": { lang: "Env", color: LANG_YELLOW },
  ".env.test": { lang: "Env", color: LANG_YELLOW },
  ".env.example": { lang: "Env", color: LANG_YELLOW },
  makefile: { lang: "Makefile", color: LANG_GRAY },
  rakefile: { lang: "Rakefile", color: LANG_RED },
  gemfile: { lang: "Gemfile", color: LANG_RED },
  "gemfile.lock": { lang: "Gemfile", color: LANG_RED },
  "cargo.toml": { lang: "Cargo", color: LANG_ORANGE },
  "cargo.lock": { lang: "Cargo", color: LANG_ORANGE },
  "go.mod": { lang: "Go Module", color: LANG_CYAN },
  "go.sum": { lang: "Go Sum", color: LANG_CYAN },
  "package.json": { lang: "npm", color: LANG_RED },
  "package-lock.json": { lang: "npm", color: LANG_RED },
  "pnpm-lock.yaml": { lang: "pnpm", color: LANG_AMBER },
  "pnpm-workspace.yaml": { lang: "pnpm", color: LANG_AMBER },
  "yarn.lock": { lang: "Yarn", color: LANG_BLUE },
  "bun.lockb": { lang: "Bun", color: LANG_AMBER },
  "deno.json": { lang: "Deno", color: LANG_BLUE },
  "deno.lock": { lang: "Deno", color: LANG_BLUE },
  "tsconfig.json": { lang: "TypeScript", color: LANG_BLUE },
  "jsconfig.json": { lang: "JavaScript", color: LANG_YELLOW },
  "tailwind.config.js": { lang: "Tailwind", color: LANG_CYAN },
  "tailwind.config.ts": { lang: "Tailwind", color: LANG_CYAN },
  "postcss.config.js": { lang: "PostCSS", color: LANG_RED },
  "postcss.config.mjs": { lang: "PostCSS", color: LANG_RED },
  "next.config.js": { lang: "Next.js", color: LANG_GRAY },
  "next.config.ts": { lang: "Next.js", color: LANG_GRAY },
  "next.config.mjs": { lang: "Next.js", color: LANG_GRAY },
  "vite.config.ts": { lang: "Vite", color: LANG_VIOLET },
  "vite.config.js": { lang: "Vite", color: LANG_VIOLET },
  "vitest.config.ts": { lang: "Vitest", color: LANG_GREEN },
  "jest.config.js": { lang: "Jest", color: LANG_ROSE },
  "jest.config.ts": { lang: "Jest", color: LANG_ROSE },
  "webpack.config.js": { lang: "Webpack", color: LANG_BLUE },
  "rollup.config.js": { lang: "Rollup", color: LANG_RED },
  "turbo.json": { lang: "Turborepo", color: LANG_ROSE },
  "vercel.json": { lang: "Vercel", color: LANG_GRAY },
  "netlify.toml": { lang: "Netlify", color: LANG_TEAL },
  "fly.toml": { lang: "Fly.io", color: LANG_VIOLET },
  procfile: { lang: "Procfile", color: LANG_GRAY },
  "requirements.txt": { lang: "pip", color: LANG_GREEN },
  "pyproject.toml": { lang: "Python", color: LANG_GREEN },
  "setup.py": { lang: "Python", color: LANG_GREEN },
  "setup.cfg": { lang: "Python", color: LANG_GREEN },
  pipfile: { lang: "Pipfile", color: LANG_GREEN },
  "pipfile.lock": { lang: "Pipfile", color: LANG_GREEN },
  "poetry.lock": { lang: "Poetry", color: LANG_VIOLET },
  "mix.exs": { lang: "Mix", color: LANG_VIOLET },
  "mix.lock": { lang: "Mix", color: LANG_VIOLET },
  "pubspec.yaml": { lang: "Dart", color: LANG_BLUE },
  "pubspec.lock": { lang: "Dart", color: LANG_BLUE },
  "build.gradle": { lang: "Gradle", color: LANG_TEAL },
  "settings.gradle": { lang: "Gradle", color: LANG_TEAL },
  "pom.xml": { lang: "Maven", color: LANG_RED },
  "cmakelists.txt": { lang: "CMake", color: LANG_RED },
  justfile: { lang: "Justfile", color: LANG_GRAY },
  vagrantfile: { lang: "Vagrant", color: LANG_BLUE },
  jenkinsfile: { lang: "Jenkins", color: LANG_RED },
  license: { lang: "License", color: LANG_GRAY },
  "license.md": { lang: "License", color: LANG_GRAY },
  readme: { lang: "Readme", color: LANG_GRAY },
  "readme.md": { lang: "Readme", color: LANG_GRAY },
  changelog: { lang: "Changelog", color: LANG_GRAY },
  "changelog.md": { lang: "Changelog", color: LANG_GRAY },
};
