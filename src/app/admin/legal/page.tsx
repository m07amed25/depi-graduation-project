"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FileText,
  Save,
  Eye,
  Pencil,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  Minus,
  Strikethrough,
  Table,
  CheckSquare,
} from "lucide-react";

const PAGES = [
  { slug: "terms", title: "Terms of Service" },
  { slug: "privacy", title: "Privacy Policy" },
] as const;

export default function AdminLegalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Legal Pages</h1>
        <p className="text-muted-foreground">
          Manage Terms of Service and Privacy Policy content using Markdown.
        </p>
      </div>
      <Tabs defaultValue="terms">
        <TabsList>
          {PAGES.map((p) => (
            <TabsTrigger key={p.slug} value={p.slug}>
              {p.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {PAGES.map((p) => (
          <TabsContent key={p.slug} value={p.slug}>
            <LegalEditor slug={p.slug} defaultTitle={p.title} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// ── Toolbar actions ──────────────────────────────────────────────────────

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  action: (ta: HTMLTextAreaElement) => { before: string; after: string; placeholder: string; block?: boolean };
}

const TOOLBAR_ACTIONS: (ToolbarAction | "separator")[] = [
  { icon: Heading1, label: "Heading 1", action: () => ({ before: "# ", after: "", placeholder: "Heading 1", block: true }) },
  { icon: Heading2, label: "Heading 2", action: () => ({ before: "## ", after: "", placeholder: "Heading 2", block: true }) },
  { icon: Heading3, label: "Heading 3", action: () => ({ before: "### ", after: "", placeholder: "Heading 3", block: true }) },
  "separator",
  { icon: Bold, label: "Bold", action: () => ({ before: "**", after: "**", placeholder: "bold text" }) },
  { icon: Italic, label: "Italic", action: () => ({ before: "*", after: "*", placeholder: "italic text" }) },
  { icon: Strikethrough, label: "Strikethrough", action: () => ({ before: "~~", after: "~~", placeholder: "strikethrough" }) },
  { icon: Code, label: "Inline Code", action: () => ({ before: "`", after: "`", placeholder: "code" }) },
  "separator",
  { icon: List, label: "Bullet List", action: () => ({ before: "- ", after: "", placeholder: "List item", block: true }) },
  { icon: ListOrdered, label: "Numbered List", action: () => ({ before: "1. ", after: "", placeholder: "List item", block: true }) },
  { icon: CheckSquare, label: "Task List", action: () => ({ before: "- [ ] ", after: "", placeholder: "Task item", block: true }) },
  "separator",
  { icon: Link, label: "Link", action: () => ({ before: "[", after: "](url)", placeholder: "link text" }) },
  { icon: Quote, label: "Blockquote", action: () => ({ before: "> ", after: "", placeholder: "Quote", block: true }) },
  { icon: Minus, label: "Horizontal Rule", action: () => ({ before: "\n---\n", after: "", placeholder: "" }) },
  { icon: Table, label: "Table", action: () => ({ before: "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| ", after: " | Cell | Cell |\n", placeholder: "Cell" }) },
];

// ── Editor Component ─────────────────────────────────────────────────────

function LegalEditor({
  slug,
  defaultTitle,
}: {
  slug: string;
  defaultTitle: string;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.legalGet.useQuery({ slug });
  const [content, setContent] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mutation = trpc.admin.legalUpsert.useMutation({
    onSuccess: () => {
      toast.success(`${defaultTitle} saved`);
      utils.admin.legalGet.invalidate({ slug });
    },
    onError: (e) => toast.error(e.message),
  });

  const value = content ?? data?.content ?? "";

  const applyAction = useCallback(
    (action: ToolbarAction["action"]) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      const { before, after, placeholder, block } = action(ta);

      let insertion: string;
      let newCursorStart: number;
      let newCursorEnd: number;

      const text = selected || placeholder;
      insertion = before + text + after;

      // For block-level items, ensure we're on a new line
      let prefix = "";
      if (block && start > 0 && value[start - 1] !== "\n") {
        prefix = "\n";
      }

      const newValue =
        value.slice(0, start) + prefix + insertion + value.slice(end);
      setContent(newValue);

      // Position cursor around the inserted/selected text
      const offset = start + prefix.length + before.length;
      newCursorStart = offset;
      newCursorEnd = offset + text.length;

      // Restore focus and selection after React re-renders
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(newCursorStart, newCursorEnd);
      });
    },
    [value],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {defaultTitle}
          </CardTitle>
          <CardDescription>
            {data?.updatedAt
              ? `Last updated: ${new Date(data.updatedAt).toLocaleDateString()}`
              : "Not yet published"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
          >
            {mode === "edit" ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </>
            )}
          </Button>
          <Button
            size="sm"
            disabled={mutation.isPending || !value.trim()}
            onClick={() =>
              mutation.mutate({ slug, title: defaultTitle, content: value })
            }
          >
            <Save className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "edit" ? (
          <div className="space-y-2">
            {/* Toolbar */}
            <TooltipProvider delayDuration={300}>
              <div className="flex flex-wrap items-center gap-0.5 rounded-md border bg-muted/50 p-1">
                {TOOLBAR_ACTIONS.map((item, i) => {
                  if (item === "separator") {
                    return (
                      <Separator
                        key={`sep-${i}`}
                        orientation="vertical"
                        className="mx-1 h-6"
                      />
                    );
                  }
                  const Icon = item.icon;
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => applyAction(item.action)}
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              className="min-h-[500px] font-mono text-sm leading-relaxed"
              placeholder={`# ${defaultTitle}\n\nWrite your content in Markdown…`}
              value={value}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        ) : (
          <div className="min-h-[500px] rounded-md border p-6 prose prose-sm dark:prose-invert max-w-none">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No content yet.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
