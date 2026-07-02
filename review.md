# Code Catch — Codebase Review & Feature Plan

> **App**: Code Catch (DevReview-AI)  
> **Tagline**: Smart Automated Code Reviews  
> **Author**: Mohamed Reda  
> **Last Reviewed**: June 2026

---

## 1. Tech Stack Overview

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Framer Motion, Radix UI, Tailwind CSS 4, shadcn/ui |
| API Layer | tRPC (client ↔ server), REST webhooks |
| Database | PostgreSQL via Prisma ORM |
| Auth | Better Auth (OAuth, credentials, SSO/SAML) |
| Background Jobs | Inngest |
| Real-Time | Pusher (presence, notifications, typing indicators) |
| AI Providers | Groq (primary), OpenAI (fallback/configurable) |
| Payments | Fawaterak (Egypt), Stripe adapter (international) |
| Email | Nodemailer + Resend, React Email templates |
| Diagrams | Mermaid + React Flow (XYFlow) |
| Charts | Recharts |
| Rate Limiting | Upstash Redis |
| Hosting | Vercel (implied by `.vercelignore`) |

---

## 2. Existing Features (Current State)

### 2.1 Core — AI Code Review Engine
- Automated review of GitHub Pull Requests using AI (Groq / OpenAI).
- Each review produces:
  - **Risk Score** (0–100)
  - **Summary** (natural-language overview)
  - **Line-level comments** with severity (`critical`, `high`, `medium`, `low`, `info`) and category (`bug`, `security`, `performance`, `style`, `suggestion`, `custom-rule`)
  - **Quality Metrics**: complexity, maintainability, readability, testability (0–100 each)
  - **Confidence score** per comment
- Review depth is user-configurable (`standard` / deeper modes).
- Auto-retry on failure (2 retries via Inngest).
- Chain reviews — `parentReviewId` allows iterative review passes.

### 2.2 GitHub Integration
- **OAuth connection** via Better Auth (GitHub provider).
- **Repository sync**: lists and stores user's GitHub repos.
- **Webhook-driven auto-review**: on `pull_request` events (`opened`, `synchronize`, `reopened`), the app:
  - Verifies HMAC-SHA256 signature
  - Skips draft PRs
  - Creates a review record and queues the Inngest job
  - Posts a **GitHub commit status** (`pending` → `success`/`failure`)
  - Posts a **PR review comment** back to GitHub with findings
- **Webhook config** per repository with optional risk-score threshold for branch protection.
- **Badge API**: generates shields.io-style badges for repo README files.

### 2.3 Security Scanning
- Orchestrated by `SecurityScannerService` with four sub-scanners:
  - **Secrets Scanner** — detects hardcoded secrets, API keys, tokens.
  - **OWASP Top 10 Scanner** — checks for injection, XSS, broken auth patterns.
  - **Dependency Scanner** — reads `package.json` / lock files for vulnerable packages.
  - **NVD Scanner** — queries the National Vulnerability Database for CVE lookups.
- Each issue stores: severity, type (`VULNERABILITY`, `SECRET_EXPOSURE`, `OWASP_TOP_10`, `CODE_QUALITY`, `CWE`), CVE/CWE IDs, affected lines, remediation guidance.
- False-positive marking and resolution tracking.
- Security issues are surfaced both in the dashboard and in email alerts.

### 2.4 Collaborative Review (Real-Time)
- Powered by Pusher presence channels.
- Multiple team members can review the same PR simultaneously.
- **Thread-based comments**: per-file, per-line threads with resolve/unresolve.
- **Comment reactions** (emoji-based, one per user per emoji).
- **Presence avatars**: shows who's currently viewing the review.
- **Typing indicators**: shows when someone is composing a comment.
- **Review approvals**: users can approve, request changes, or comment.
- **Review assignments**: assign reviews to team members with priority and due date.

### 2.5 Diff Viewer
- **Split view** and **unified view** modes.
- **Syntax highlighting** with language auto-detection.
- **Code folding** for large files.
- **Code minimap** for quick navigation.
- File cards with addition/deletion stats.

### 2.6 Diagram Generation
- Automatically generates **ERD diagrams** when schema files change in a PR.
- Triggers on: Prisma schemas, SQL migrations, Drizzle schemas, entity/model files.
- Renders with **Mermaid** and interactive **React Flow** viewer.
- Toolbar with zoom, pan, export capabilities.
- Node info panel for entity details.

### 2.7 Code Timeline
- Commit-by-commit view of a PR's history.
- Commit detail dialogs with file-level changes.
- Timeline skeleton loading states.

### 2.8 Team Management
- Create and manage teams with slug-based URLs.
- **Roles**: Owner, Admin, Member.
- **Team actions** with approval workflow: invite/remove members, update roles, share/unshare repositories, delete team.
- Team-scoped repositories.
- Team-level review rules.

### 2.9 Review Rules Engine
- Custom rules with name, description, regex pattern, and severity.
- Scoped per user, repository, or team.
- Enabled/disabled toggle.
- Rules are injected into the AI prompt as `custom-rule` category during review.

### 2.10 Scheduled Scans
- Per-repository scheduled scan configuration.
- **Cadence**: Daily or Weekly.
- Scan runs tracked with status (`RUNNING`, `COMPLETED`, `FAILED`) and summary.
- Email notification on scan completion.

### 2.11 Branch Protection Recommendations
- AI-generated recommendations for GitHub branch protection rules.
- Priority levels: High, Medium, Low.
- Dismissible by the user.

### 2.12 Notifications System
- **Real-time** via Pusher (with desktop notification support).
- **Email** notifications (configurable per user).
- **Types**: team invite, team member added, review completed, review failed, scheduled scan completed, review assigned, review approved, review changes requested.
- Per-user notification preferences (granular toggle per type).
- Sound notification option.

### 2.13 Analytics Dashboard
- **Key metrics**: total reviews, average risk score, issue counts by severity.
- **Charts**: review trend over time, feedback trend, quality workload distribution.
- **Issue tables**: top repositories by issues, recent critical findings.
- **Anomaly alerts** for unusual patterns.
- **Quick actions** card for common operations.
- Animated number counters and chart transitions.

### 2.14 Billing & Payments
- **Pricing plans**: Free, Pro, Enterprise (admin-editable from dashboard).
- **Billing cycles**: Monthly / Yearly (with annual discount, default 20%).
- **Payment gateways**:
  - **Fawaterak** (Egyptian market): Visa/Mastercard, Fawry, mobile wallets.
  - **Stripe adapter** (international, gateway abstraction).
- **Invoice system**: full lifecycle (initiated → processing → paid → refunded).
- **Payment ledger**: append-only `PaymentEvent` table — never update/delete.
- **Idempotency**: duplicate payment prevention via idempotency keys and webhook dedup.
- **Saved cards**: tokenized via Fawaterak, fingerprint stored for dedup.
- **Promo/discount system**: percentage or fixed discounts, per-plan or global, usage limits, expiry.
- **Partner domain pricing**: auto-apply custom pricing for users from specific email domains.
- **User price overrides**: per-email custom pricing.
- **Refunds**: configurable refund window (default 14 days).
- **Trial period**: configurable trial days (default 14) on Pro plan.
- **Account credit**: non-withdrawable credit in cents.

### 2.15 User Settings
- Review preferences: depth, default language, auto-review toggle, AI model selection.
- Security checks toggle, performance suggestions toggle.
- Notification preferences (granular per notification type).
- Active sessions management (view and revoke).
- Review rules manager (CRUD with regex patterns).
- Scheduled scan configuration per repository.

### 2.16 Profile
- Profile editing (name, image).
- Image upload with crop dialog.
- Connected accounts (GitHub, etc.) with link/unlink.
- Subscription card showing current plan and status.

### 2.17 Admin Panel
- **Dashboard**: system-wide stats and overview.
- **User Management**: list, search, ban/unban, plan override, role assignment, user detail pages.
- **Team Management**: view and manage all teams.
- **Repository Management**: view all connected repos.
- **Review Management**: view and manage all reviews.
- **Pricing Management**: plan editor, global settings, discounts, partner domains, price overrides.
- **Capabilities Manager**: feature flags per plan (enforced or display-only).
- **Custom Roles**: define roles with granular permissions.
- **SSO Providers**: manage SAML/OIDC providers per organization.
- **Audit Logs**: full audit trail with IP, user-agent, geo (country, city).
- **Email Templates**: CRUD for transactional and broadcast emails.
- **Newsletter**: subscriber management and campaign sending.
- **Legal Pages**: edit privacy policy and terms of service (Markdown editor).
- **Messages/Support**: view contact and support messages.
- **Feedback**: user-submitted feedback and review feedback.
- **Security Dashboard**: system-wide security issue overview.
- **System Settings**: maintenance mode toggle, banner configuration, retention policies.

### 2.18 Auth & Access Control
- **Better Auth**: credentials (email/password), GitHub OAuth, SSO (SAML/OIDC).
- **Middleware**: route protection, maintenance mode redirect, session validation.
- **Role-based access**: USER / ADMIN roles + custom roles with permission sets.
- **Capability enforcement**: per-plan feature gating via DB-driven capability catalog.
- **Rate limiting**: Upstash Redis-based, per-user/per-IP.

### 2.19 Public Pages
- **Home/Landing**: hero section, features showcase, how-it-works, stats, languages section, CTA section, parallax effects.
- **Product page**: product features with diagram showcase.
- **Pricing page**: plan cards, comparison table, FAQ.
- **About page**: team section, stats grid, company info.
- **Contact page**: contact form with categories.
- **Blog page**: (placeholder).
- **Changelog page**: (placeholder).
- **Legal pages**: privacy policy, terms of service (admin-editable).
- **API docs**: (placeholder route exists).
- **Status page**: (placeholder).
- **Maintenance page**: shown when maintenance mode is active.
- **Auth error page**: handles OAuth error redirects.

### 2.20 Email System
- **Transport**: Nodemailer (SMTP) + Resend (API) — configurable.
- **Templates** (React Email):
  - Review completed, security alert
  - Team member added, admin promoted/demoted
  - Plan changed, refund processed
  - GitHub connection warning
  - Support reply, broadcast
- **Broadcast emails** via admin newsletter system.
- **Unsubscribe** endpoint with token-based verification.

### 2.21 Infrastructure
- **Background jobs** (Inngest): review-pr, post-review-to-github, generate-diagram, security-scan, scheduled-scan, broadcast-email, subscription management.
- **File upload**: Vercel Blob storage with file-type validation.
- **Error boundary**: React error boundary for graceful UI failure recovery.
- **Health check**: component for system health monitoring.
- **Audit logging**: every significant action logged with actor, IP, user-agent, geo.

---

## 3. Architecture Strengths

1. **Feature-sliced architecture** — `src/features/` co-locates UI, server logic, and types per domain.
2. **tRPC** — end-to-end type safety without manual schema duplication.
3. **Inngest** — reliable, retryable background job processing with failure handlers.
4. **Append-only payment ledger** — correct financial data modeling.
5. **DB-driven capabilities** — feature flags managed by admin, not hardcoded.
6. **Real-time layer** — Pusher integration for collaborative review and notifications.
7. **Multi-gateway payment** — Fawaterak + Stripe adapter pattern supports regional expansion.
8. **Comprehensive admin panel** — full operational control without code deploys.

---

## 4. Areas for Improvement

| Area | Issue |
|---|---|
| **Test coverage** | Only a handful of test files; no E2E or integration tests. |
| **Blog / Changelog** | Pages exist but appear to be placeholders. |
| **API docs** | `api-docs` route exists but is empty. |
| **Public REST API** | No `v1` REST API for external integrations. |
| **i18n** | No internationalization — English only. |
| **Accessibility audit** | No evidence of systematic a11y testing. |
| **Error tracking** | No Sentry or equivalent integration visible. |
| **Feature onboarding** | `driver.js` is installed but usage unclear. |
| **CI/CD config** | No visible CI configuration (GitHub Actions, etc.). |
| **Monitoring/observability** | Pino logger present but no structured log aggregation. |

---

## 5. New Feature Plan

### Phase 1 — Foundation & Quality (Short Term)

#### 5.1 Public REST API (v1)
- Expose a versioned REST API (`/api/v1/`) for external tool integrations.
- Endpoints: `GET /reviews`, `POST /reviews` (trigger review), `GET /repos`, `GET /security-issues`.
- API key authentication scoped per user/team.
- OpenAPI spec auto-generated from tRPC or Zod schemas.
- Rate limiting per API key.

#### 5.2 AI-Powered Review Summaries (PR Digest)
- Daily/weekly email digest summarizing all reviews across a team's repos.
- Highlights: most critical findings, trending issue categories, team velocity.
- Configurable per team in settings.

#### 5.3 Inline Code Fix Suggestions
- Extend AI review to produce **apply-able code patches** (not just text suggestions).
- "Apply Fix" button in the diff viewer that creates a commit on the PR branch.
- Start with simple patterns (unused imports, missing null checks, style fixes).

#### 5.4 Test Generation
- AI-generated unit test suggestions for changed files.
- Output as a downloadable test file or PR comment.
- Support Jest, Pytest, PHPUnit based on detected language.

#### 5.5 Comprehensive Test Suite
- E2E tests with Playwright covering: auth flow, review creation, team management, billing.
- Integration tests for tRPC routers with test database.
- Snapshot tests for email templates.

### Phase 2 — Collaboration & Insights (Medium Term)

#### 5.6 Review Quality Insights
- Track which AI suggestions are accepted vs dismissed over time.
- "AI Accuracy Score" per repository/language.
- Feedback loop: use acceptance data to improve prompts.
- Team leaderboard for review participation.

#### 5.7 Slack / Discord / Microsoft Teams Integration
- Send review notifications to team channels.
- Slash commands: `/review <pr-url>` to trigger a review.
- Rich message cards with risk score, issue count, and links.

#### 5.8 PR Risk Prediction (Pre-Review)
- Before triggering a full review, show a quick "risk prediction" based on:
  - Files changed, lines added/deleted
  - Historical review data for the same files
  - Author's past review patterns
- Helps prioritize which PRs need deep review.

#### 5.9 Codebase Health Score
- Aggregate metric per repository tracking:
  - Average review quality over time
  - Security issue resolution rate
  - Technical debt indicators
- Visualized as a trend chart on the repo detail page.

#### 5.10 Multi-Language AI Models
- Let users pick different AI models per review (GPT-4o, Claude, Gemini, Llama).
- Model comparison mode: run two models on the same PR and compare results.
- Per-language model optimization (e.g., better model for Python vs TypeScript).

### Phase 3 — Platform & Scale (Long Term)

#### 5.11 Marketplace / Plugin System
- Allow third-party review rule plugins.
- Custom scanners (e.g., license compliance, API contract validation).
- Community-contributed rule sets.

#### 5.12 Self-Hosted / On-Premise Option
- Docker Compose deployment for enterprise customers.
- Bring-your-own AI API keys.
- External database support (PostgreSQL, MySQL).

#### 5.13 Multi-Provider Git Support
- Extend beyond GitHub to **GitLab** and **Bitbucket**.
- Abstract git provider layer: common interface for PR/MR operations.
- Unified webhook handling for all providers.

#### 5.14 AI Code Generation from Review Comments
- When a reviewer leaves a text comment, offer an "AI Generate Fix" button.
- Produces a code patch based on the comment context.
- Learns from accepted patches to improve over time.

#### 5.15 Compliance & Reporting
- SOC 2, GDPR compliance report generation.
- Exportable review audit reports for regulatory requirements.
- Custom report builder with date ranges, filters, and PDF export.

#### 5.16 Internationalization (i18n)
- Multi-language UI using `next-intl` or `next-i18next`.
- Localized AI review summaries (output in user's preferred language).
- RTL support for Arabic/Hebrew.

---

## 6. Priority Matrix

| Feature | Effort | Impact | Priority |
|---|---|---|---|
| Public REST API | High | High | P1 |
| Inline Code Fix Suggestions | High | High | P1 |
| Comprehensive Test Suite | Medium | High | P1 |
| Slack/Discord Integration | Medium | High | P2 |
| AI Review Digest | Low | Medium | P2 |
| Review Quality Insights | Medium | Medium | P2 |
| PR Risk Prediction | Medium | Medium | P2 |
| Test Generation | High | Medium | P3 |
| Multi-Language AI Models | Medium | Medium | P3 |
| Codebase Health Score | Medium | Low | P3 |
| Marketplace / Plugins | Very High | High | P4 |
| GitLab / Bitbucket | Very High | High | P4 |
| Self-Hosted | Very High | Medium | P4 |
| i18n | High | Medium | P4 |
| Compliance Reporting | Medium | Low | P4 |
