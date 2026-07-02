import Groq from "groq-sdk";
import { z } from "zod";

let groqClient: Groq | null = null;
let currentApiKey: string | undefined = undefined;

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  if (currentApiKey && currentApiKey !== apiKey) {
    resetClient();
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
    currentApiKey = apiKey;
  }

  return groqClient;
}

export function resetClient(): void {
  groqClient = null;
  currentApiKey = undefined;
}

export const ReviewCommentSchema = z.object({
  file: z.string().catch("unknown"),
  line: z.coerce.number().catch(1),
  severity: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(z.enum(["critical", "high", "medium", "low", "info"]))
    .catch("medium"),
  category: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(
      z.enum([
        "bug",
        "security",
        "performance",
        "style",
        "suggestion",
        "custom-rule",
      ]),
    )
    .catch("suggestion"),
  message: z.string().catch("Issue detected"),
  suggestion: z.string().optional().nullable(),
  confidence: z.coerce.number().min(0).max(100).optional().nullable(),
  ruleName: z.string().optional().nullable(),
});

export const QualityMetricsSchema = z.object({
  complexity: z.coerce.number().min(0).max(100).catch(50),
  maintainability: z.coerce.number().min(0).max(100).catch(50),
  readability: z.coerce.number().min(0).max(100).catch(50),
  testability: z.coerce.number().min(0).max(100).catch(50),
});

export const ReviewResultSchema = z.object({
  summary: z.string().catch("Review completed."),
  riskScore: z.coerce.number().min(0).max(100).catch(50),
  comments: z.array(ReviewCommentSchema).catch([]),
  qualityMetrics: QualityMetricsSchema.optional().nullable(),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type ReviewResult = z.infer<typeof ReviewResultSchema>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;

interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

const BASE_SYSTEM_PROMPT = `You are a senior software engineer performing a rigorous, production-focused code review. Analyse the pull request diff and return a structured JSON review.

## Your goals
1. Identify **real** issues: bugs, security vulnerabilities, logic errors, data-loss risks, broken error-handling, race conditions, and missing validations.
2. Write a concise summary of what the PR changes and your overall assessment.
3. Assign a **riskScore** (0–100) that reflects only functional and security risk — NOT style or formatting. See the scoring guide below.
4. Rate quality metrics honestly — do not inflate scores.
5. Flag your confidence per issue. If confidence is below 70, omit the issue entirely rather than guessing.

## What NOT to do
- Do NOT invent issues to pad the list. If the code is correct and safe, return few or zero comments — that is a valid and expected result.
- Do NOT flag style/formatting/naming as medium or high severity. Style comments must always be "low" severity and "style" category.
- Do NOT flag issues that are clearly handled elsewhere in the visible diff.
- Do NOT flag issues where the correct fix is already present in the code.
- Do NOT include low-confidence (< 70%) guesses.

## Risk score guide (0–100) — style issues do NOT affect this score
- 0–15:  Clean code, no meaningful risks
- 16–30: Minor issues, no production risk
- 31–50: Some real bugs or gaps that should be fixed before merge
- 51–70: Significant bugs or security weaknesses that need addressing
- 71–85: Serious issues likely to cause production failures
- 86–100: Critical: data loss, security breach, or system crash likely

The riskScore must be calculated from only: critical + high + medium severity issues of category "bug", "security", or "performance". Style and suggestion comments must never increase the riskScore.

## Severity guide
- critical: Security vulnerability, data loss, crash
- high:     Bug that will fail in normal production use
- medium:   Logic gap or missing guard that may cause issues in edge cases
- low:      Minor style issue, cosmetic improvement — never affects risk score
- info:     Non-actionable observation, documentation note, or FYI remark — never affects risk score

## Category guide
- bug:          Incorrect logic, broken behaviour
- security:     Vulnerability, injection, auth bypass, data exposure
- performance:  Unnecessary computation, N+1 query, memory leak
- style:        Naming, formatting, organisation — ALWAYS low severity
- suggestion:   Optional improvement, alternative approach — ALWAYS low severity

## Confidence guide — only include issues with confidence >= 70
- 90–100: Certain — clear bug or vulnerability in the visible code
- 70–89:  Likely — real issue but context outside the diff may change this
- < 70:   Do not report

## Response schema (valid JSON only)
{
  "summary": "2–4 sentence summary of the changes and overall assessment",
  "riskScore": <integer 0-100, based on bug/security/performance issues only>,
  "qualityMetrics": {
    "complexity":      <0-100, 100 = very simple>,
    "maintainability": <0-100, 100 = very maintainable>,
    "readability":     <0-100, 100 = crystal clear>,
    "testability":     <0-100, 100 = easily testable>
  },
  "comments": [
    {
      "file": "path/to/file.ts",
      "line": <integer>,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "category": "bug" | "security" | "performance" | "style" | "suggestion" | "custom-rule",
      "message": "Clear, specific description of the issue",
      "suggestion": "Concrete fix (optional)",
      "confidence": <integer 70-100>,
      "ruleName": "rule name when category is custom-rule (optional)"
    }
  ]
}`;

export interface CustomRule {
  name: string;
  description: string;
  pattern?: string | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface ReviewPreferences {
  reviewDepth?: string;
  defaultLanguage?: string;
  includeSecurityChecks?: boolean;
  includePerfSuggestions?: boolean;
  customRules?: CustomRule[];
}

/**
 * Strip characters that could be used to inject new instructions into an AI
 * system prompt (angle brackets, backticks, null bytes, and common Unicode
 * control characters).  This is applied to every user-controlled string
 * before it is interpolated into the prompt.
 */
function sanitizePromptField(value: string): string {
  return value
    .replace(/[<>`\x00-\x1F\x7F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500); // hard cap so no single field can dominate the prompt
}

function buildSystemPrompt(preferences?: ReviewPreferences): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  if (preferences) {
    if (preferences.reviewDepth === "quick") {
      parts.push(
        "\nIMPORTANT: Provide a quick, high-level overview. Focus only on critical and high severity issues. Keep comments brief and limit to the most important findings.",
      );
    } else if (preferences.reviewDepth === "thorough") {
      parts.push(
        "\nIMPORTANT: Provide an exhaustive, detailed review. Examine every changed line carefully. Include low-severity style suggestions and minor improvements. Be thorough in your analysis and provide detailed explanations.",
      );
    }

    if (preferences.defaultLanguage && preferences.defaultLanguage !== "auto") {
      // Sanitize before interpolating into the prompt to prevent injection.
      const safeLanguage = sanitizePromptField(preferences.defaultLanguage);
      parts.push(
        `\nNote: The primary language context for this project is ${safeLanguage}. Use this context for language-specific best practices.`,
      );
    }

    if (preferences.includeSecurityChecks === false) {
      parts.push(
        "\nDo NOT include security-related comments. Skip any security vulnerability analysis.",
      );
    } else {
      parts.push(
        "\nPay special attention to security vulnerabilities: injection attacks, authentication/authorization issues, sensitive data exposure, and insecure configurations.",
      );
    }

    if (preferences.includePerfSuggestions === false) {
      parts.push(
        "\nDo NOT include performance-related comments. Skip any performance optimization suggestions.",
      );
    } else {
      parts.push(
        "\nInclude performance analysis: identify potential bottlenecks, unnecessary computations, memory leaks, and suggest optimizations.",
      );
    }

    // Inject custom team/repository rules
    if (preferences.customRules && preferences.customRules.length > 0) {
      const ruleLines = preferences.customRules.map((rule, i) => {
        const severityLabel =
          rule.severity.charAt(0) + rule.severity.slice(1).toLowerCase();
        // Sanitize all user-controlled fields to prevent prompt injection.
        // Strip angle brackets, backticks, and control characters that could
        // be used to inject new instructions into the system prompt.
        const safeName = sanitizePromptField(rule.name);
        const safeDescription = sanitizePromptField(rule.description);
        const safePattern = rule.pattern
          ? sanitizePromptField(rule.pattern)
          : null;
        const patternNote = safePattern
          ? ` [Regex trigger: /${safePattern}/]`
          : "";
        return `  ${i + 1}. [${severityLabel}] ${safeName}${patternNote}: ${safeDescription}`;
      });

      parts.push(
        `\n\nCUSTOM TEAM RULES — you MUST check the code against each rule below and report violations as a separate comment with category "custom-rule" and the exact rule name in the "ruleName" field:\n${ruleLines.join("\n")}`,
      );
    }
  }

  return parts.join("\n");
}

const MAX_DIFF_CHARS = 8_000;
const MAX_PATCH_CHARS_PER_FILE = 3_000;

function truncateDiff(diff: string): string {
  if (diff.length <= MAX_DIFF_CHARS) return diff;
  return (
    diff.slice(0, MAX_DIFF_CHARS) +
    "\n\n... [diff truncated — file too large for full review] ..."
  );
}

function extractJSON(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch?.[1]) {
      return JSON.parse(fenceMatch[1]);
    }
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch?.[0]) {
      return JSON.parse(braceMatch[0]);
    }
    throw new Error("Could not extract valid JSON from AI response");
  }
}

async function callGroq(
  groq: Groq,
  systemPrompt: string,
  userPrompt: string,
  model: string,
  responseFormat: "json_object" | "text" = "json_object",
): Promise<string | undefined> {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4096,
    temperature: 0.2,
    ...(responseFormat === "json_object"
      ? { response_format: { type: "json_object" } }
      : {}),
  });
  return response.choices[0]?.message?.content ?? undefined;
}

const IGNORED_FILE_PATTERNS = [
  /schema\.prisma$/,
  /\/migrations?\//,
  /\.sql$/,
  // Any folder starting with "." (e.g. .kiro, .vscode, .agent, .github)
  /(^|\/)\.[^/]+\//,
];

export async function reviewCode(
  prTitle: string,
  files: FileChange[],
  preferences?: ReviewPreferences,
): Promise<ReviewResult> {
  const diffContent = truncateDiff(
    files
      .filter((f) => f.patch && !IGNORED_FILE_PATTERNS.some((p) => p.test(f.filename)))
      .map((f) => {
        let patch = f.patch!;
        if (patch.length > MAX_PATCH_CHARS_PER_FILE) {
          patch =
            patch.slice(0, MAX_PATCH_CHARS_PER_FILE) +
            "\n... [patch truncated — file too large] ...";
        }
        return `### ${f.filename} (${f.status})\n\`\`\`diff\n${patch}\n\`\`\``;
      })
      .join("\n\n"),
  );

  if (!diffContent.trim()) {
    return {
      summary: "No code changes to review (binary files or empty diff).",
      riskScore: 0,
      comments: [],
    };
  }

  const userPrompt = `Review this pull request:

**Title:** ${prTitle}

**Changes:**
${diffContent}`;

  const groq = getGroqClient();
  const systemPrompt = buildSystemPrompt(preferences);

  let content: string | undefined;
  try {
    content = await callGroq(
      groq,
      systemPrompt,
      userPrompt,
      "llama-3.3-70b-versatile",
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (
      errMsg.includes("413") ||
      errMsg.includes("429") ||
      errMsg.includes("rate_limit")
    ) {
      try {
        content = await callGroq(
          groq,
          systemPrompt,
          userPrompt,
          "llama-3.1-8b-instant",
        );
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Unknown AI provider error";
        throw new Error(
          `AI service request failed (fallback model): ${fallbackMsg}`,
        );
      }
    } else {
      throw new Error(`AI service request failed: ${errMsg}`);
    }
  }

  if (!content) {
    throw new Error("No response content from AI");
  }

  try {
    const parsed = extractJSON(content);
    return ReviewResultSchema.parse(parsed);
  } catch (err) {
    console.error("Failed to parse AI response:", err);
    console.error("Raw AI response:", content.slice(0, 500));
    return {
      summary:
        "The AI review completed but the response could not be fully parsed. Please try again.",
      riskScore: 50,
      comments: [],
    };
  }
}

export interface AskFollowUpContext {
  file: string;
  line: number;
  severity: string;
  category?: string | null;
  message: string;
  suggestion?: string | null;
}

/**
 * Answer a developer's follow-up question about a specific code review finding.
 */
export async function askFollowUp(
  context: AskFollowUpContext,
  question: string,
): Promise<string> {
  const groq = getGroqClient();

  const systemPrompt = `You are a senior software engineer helping a developer understand a code review finding.
Be concise (2–4 sentences), practical, and educational. Focus only on answering the question.
Do not repeat information already visible in the finding. If a short code snippet clarifies the answer, include it.`;

  const safeMessage = sanitizePromptField(context.message);
  const safeQuestion = sanitizePromptField(question);
  const safeSuggestion = context.suggestion
    ? sanitizePromptField(context.suggestion)
    : null;

  const userPrompt = `Code review finding:
- File: ${context.file}, Line ${context.line}
- Severity: ${context.severity}${context.category ? `, Category: ${context.category}` : ""}
- Issue: ${safeMessage}${safeSuggestion ? `\n- Suggested fix: ${safeSuggestion}` : ""}

Developer question: ${safeQuestion}`;

  let content: string | undefined;
  try {
    content = await callGroq(
      groq,
      systemPrompt,
      userPrompt,
      "llama-3.3-70b-versatile",
      "text",
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (
      msg.includes("413") ||
      msg.includes("429") ||
      msg.includes("rate_limit")
    ) {
      content = await callGroq(
        groq,
        systemPrompt,
        userPrompt,
        "llama-3.1-8b-instant",
        "text",
      );
    } else {
      throw err;
    }
  }

  return content?.trim() ?? "Unable to generate a response. Please try again.";
}
