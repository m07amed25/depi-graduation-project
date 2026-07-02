"use client";

import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Shield, FileCode, Languages, RefreshCw, Sparkles, HelpCircle } from "lucide-react";

interface Prefs {
  reviewDepth?: "quick" | "standard" | "thorough" | null;
  defaultLanguage?: string | null;
  autoReview?: boolean | null;
  includeSecurityChecks?: boolean | null;
  includePerfSuggestions?: boolean | null;
  preferredModel?: string | null;
}

interface PreferencesCardContentProps {
  prefs: Prefs | undefined | null;
  prefsLoading: boolean;
  updatePref: (key: string, value: string | boolean) => void;
}

const DEPTH_OPTIONS = [
  {
    id: "quick" as const,
    label: "Quick",
    desc: "Fast overview",
    icon: RefreshCw,
  },
  {
    id: "standard" as const,
    label: "Standard",
    desc: "Balanced analysis",
    icon: FileCode,
  },
  {
    id: "thorough" as const,
    label: "Thorough",
    desc: "Deep inspection",
    icon: Bot,
  },
];

const TOGGLE_OPTIONS = [
  {
    key: "autoReview" as const,
    label: "Auto-review new PRs",
    desc: "Automatically trigger a review when a new PR is opened",
    icon: Bot,
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    key: "includeSecurityChecks" as const,
    label: "Security analysis",
    desc: "Scan for common vulnerabilities and security issues",
    icon: Shield,
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    key: "includePerfSuggestions" as const,
    label: "Performance suggestions",
    desc: "Highlight potential performance improvements",
    icon: RefreshCw,
    color: "text-green-500 bg-green-500/10",
  },
];

const MODEL_OPTIONS = [
  { id: "openai/gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "meta/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta" },
  { id: "meta/llama-4-scout", name: "Llama 4 Scout", provider: "Meta" },
  { id: "mistralai/mistral-large-2411", name: "Mistral Large", provider: "Mistral" },
  { id: "deepseek/DeepSeek-V3-0324", name: "DeepSeek V3", provider: "DeepSeek" },
  { id: "cohere/command-a", name: "Command A", provider: "Cohere" },
];

export function PreferencesCardContent({
  prefs,
  prefsLoading,
  updatePref,
}: PreferencesCardContentProps) {
  if (prefsLoading || !prefs) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          Review Depth
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                Controls how thorough the AI review is. Quick gives a fast overview, Thorough examines every line in detail.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {DEPTH_OPTIONS.map((depth) => {
            const isActive = prefs?.reviewDepth === depth.id;
            const Icon = depth.icon;
            return (
              <button
                key={depth.id}
                onClick={() => updatePref("reviewDepth", depth.id)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all cursor-pointer ${isActive ? "border-primary bg-primary/5" : "border-transparent bg-muted/40 hover:bg-muted/60"}`}
              >
                <Icon
                  className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <span
                  className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}
                >
                  {depth.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {depth.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-md bg-blue-500/10">
            <Languages className="size-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium">Default Language</p>
            <p className="text-xs text-muted-foreground">
              Primary language for review context
            </p>
          </div>
        </div>
        <select
          value={prefs?.defaultLanguage ?? "auto"}
          onChange={(e) => updatePref("defaultLanguage", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="auto">Auto-detect</option>
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="csharp">C#</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 rounded-md bg-purple-500/10">
            <Sparkles className="size-4 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium">AI Model</p>
            <p className="text-xs text-muted-foreground">
              Model used for chat and code reviews
            </p>
          </div>
        </div>
        <select
          value={prefs?.preferredModel ?? "openai/gpt-4o"}
          onChange={(e) => updatePref("preferredModel", e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.provider})
            </option>
          ))}
        </select>
      </div>

      <Separator />

      {TOGGLE_OPTIONS.map((item) => {
        const Icon = item.icon;
        const checked = !!(prefs as Record<string, unknown>)?.[item.key];
        return (
          <div key={item.key} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center size-8 rounded-md ${item.color}`}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={checked}
              onClick={() => updatePref(item.key, !checked)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
