"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  ChevronRight,
  Info,
  Eye,
  Layout,
  LayoutTemplate,
  Check,
  Bold,
  Italic,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Code,
  Heading1,
  Heading2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SelectItem,
  SelectRoot,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "motion/react";

type CategoryType = "ONBOARDING" | "ANNOUNCEMENT" | "FEATURE" | "NEWSLETTER" | "TRANSACTIONAL" | "GENERAL";

const CATEGORIES: { value: CategoryType; label: string; color: string }[] = [
  { value: "ONBOARDING", label: "Onboarding", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { value: "ANNOUNCEMENT", label: "Announcement", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "FEATURE", label: "Feature Update", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
  { value: "NEWSLETTER", label: "Newsletter", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  { value: "TRANSACTIONAL", label: "Transactional", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { value: "GENERAL", label: "General", color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const utils = trpc.useUtils();

  // Selected template state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<CategoryType>("GENERAL");

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | "ALL">("ALL");

  // Deletion confirm state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Editor toolbar support
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fetch Templates Query
  const { data: templates = [], isLoading } = trpc.admin.listTemplates.useQuery(undefined);

  // Mutation Hooks
  const createMutation = trpc.admin.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Email template created successfully!");
      utils.admin.listTemplates.invalidate();
      setIsCreatingNew(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create template");
    },
  });

  const updateMutation = trpc.admin.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully!");
      utils.admin.listTemplates.invalidate();
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update template");
    },
  });

  const deleteMutation = trpc.admin.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully!");
      utils.admin.listTemplates.invalidate();
      setSelectedId(null);
      setConfirmDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete template");
    },
  });

  const selectedTemplate = templates.find((t) => t.id === selectedId);

  // Set form values when selected template changes
  useEffect(() => {
    if (selectedTemplate && !isCreatingNew) {
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description || "");
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.body);
      setCategory(selectedTemplate.category as CategoryType);
    }
  }, [selectedTemplate, isCreatingNew]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSubject("");
    setBody("");
    setCategory("GENERAL");
  };

  const handleCreateNewClick = () => {
    setIsCreatingNew(true);
    setIsEditing(true);
    setSelectedId(null);
    resetForm();
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setIsCreatingNew(false);
    if (selectedTemplate) {
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description || "");
      setSubject(selectedTemplate.subject);
      setBody(selectedTemplate.body);
      setCategory(selectedTemplate.category as CategoryType);
    }
  };

  const handleSave = () => {
    if (!name || !subject || !body) {
      toast.error("Please fill in all required fields (Name, Subject, Body)");
      return;
    }

    if (isCreatingNew) {
      createMutation.mutate({
        name,
        description: description || null,
        subject,
        body,
        category,
      });
    } else if (selectedId) {
      updateMutation.mutate({
        id: selectedId,
        name,
        description: description || null,
        subject,
        body,
        category,
      });
    }
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);

    setBody(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      categoryFilter === "ALL" || template.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const personalizeContent = (text: string) => {
    return text
      .replace(/\{\{name\}\}/g, "User")
      .replace(/\{\{userName\}\}/g, "User")
      .replace(/\{\{email\}\}/g, "user@example.com")
      .replace(/\{\{appUrl\}\}/g, "https://codecatch.dev");
  };

  const getCategoryBadge = (catVal: CategoryType) => {
    const catObj = CATEGORIES.find((c) => c.value === catVal) || CATEGORIES[5];
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${catObj.color}`}>
        {catObj.label}
      </span>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/10">
            <LayoutTemplate className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground">Manage personalizable pre-saved templates for your campaigns.</p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Button onClick={handleCreateNewClick} className="shadow-lg shadow-primary/20 gap-2 h-10">
            <Plus className="size-4" />
            Create Template
          </Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Directory List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/40 shadow-xl shadow-black/5">
            <CardHeader className="p-4 border-b border-border/40">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-2">
                Template Library
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 border-border/40"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={categoryFilter === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter("ALL")}
                  className="h-7 px-2.5 text-xs rounded-full"
                >
                  All
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={categoryFilter === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat.value)}
                    className="h-7 px-2.5 text-xs rounded-full"
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Directory Cards */}
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-2 text-primary" />
                <p className="text-sm">Loading template library...</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/40 rounded-xl bg-muted/10">
                <Mail className="size-8 mx-auto text-muted-foreground/60 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No templates found</p>
                <p className="text-xs text-muted-foreground/80 mt-1">Try broadening your filters or create a new template.</p>
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const isActive = template.id === selectedId && !isCreatingNew;
                return (
                  <motion.div
                    key={template.id}
                    layoutId={`template-card-${template.id}`}
                    onClick={() => {
                      setSelectedId(template.id);
                      setIsEditing(false);
                      setIsCreatingNew(false);
                    }}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary/10 border-primary shadow-md shadow-primary/5"
                        : "bg-card border-border/40 hover:border-border/80 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-semibold text-sm truncate flex-1">{template.name}</h3>
                      {getCategoryBadge(template.category as CategoryType)}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {template.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/20 pt-2">
                      <span className="truncate max-w-[200px]">Subject: {template.subject}</span>
                      <ChevronRight className={`size-3.5 transition-transform duration-200 ${isActive ? "translate-x-1 text-primary" : ""}`} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Section: Workspace Detail / Editor (8 cols) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              // ──────────────────────────────────────── VIEWING PANEL ────────────────────────────────────────
              selectedTemplate ? (
                <motion.div
                  key="view-panel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-xl font-bold">{selectedTemplate.name}</CardTitle>
                          {getCategoryBadge(selectedTemplate.category as CategoryType)}
                        </div>
                        <CardDescription className="text-sm">
                          {selectedTemplate.description || "No description provided."}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                          className="h-9 gap-2"
                        >
                          <Edit className="size-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => router.push(`/admin/newsletter?templateId=${selectedTemplate.id}`)}
                          size="sm"
                          className="h-9 shadow-md shadow-primary/10 gap-2 bg-primary hover:bg-primary/90"
                        >
                          Use in Editor
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Subject Line */}
                      <div className="space-y-1.5 pb-4 border-b border-border/40">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Subject Line</span>
                        <div className="text-lg font-semibold">{selectedTemplate.subject}</div>
                      </div>

                      {/* Rendered Preview Box */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                            <Eye className="size-3.5 text-primary" />
                            Rendered Preview (Personalized for recipient)
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded border border-border/30">
                            <Sparkles className="size-2.5 text-indigo-500" />
                            Mock User: User
                          </span>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-muted/20 p-8 min-h-[350px] overflow-auto">
                          <div className="max-w-[650px] mx-auto bg-white dark:bg-zinc-950 rounded-xl shadow-2xl p-8 border border-border/40">
                            <h2 className="text-xl font-bold mb-4 text-foreground">
                              {personalizeContent(selectedTemplate.subject)}
                            </h2>
                            <p className="text-muted-foreground text-sm mb-4">Hi User,</p>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {personalizeContent(selectedTemplate.body)}
                              </ReactMarkdown>
                            </div>
                            <div className="mt-8 pt-4 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                              Sent from CodeCatch · <span className="underline cursor-pointer">Unsubscribe</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t border-border/40 px-6 py-4 flex justify-between items-center">
                      <div className="text-xs text-muted-foreground/60">
                        Updated {new Date(selectedTemplate.updatedAt).toLocaleDateString()}
                      </div>
                      
                      {confirmDeleteId === selectedTemplate.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-destructive font-medium">Are you absolutely sure?</span>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate({ id: selectedTemplate.id })}
                            disabled={deleteMutation.isPending}
                            className="h-8"
                          >
                            {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : "Yes, Delete"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-8"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteId(selectedTemplate.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Template
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 border border-dashed border-border/40 rounded-2xl bg-card text-center min-h-[450px] shadow-lg shadow-black/5"
                >
                  <div className="p-4 rounded-full bg-primary/10 text-primary border border-primary/20 shadow-inner mb-4 animate-pulse">
                    <LayoutTemplate className="size-10" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">No Template Selected</h2>
                  <p className="text-muted-foreground text-sm max-w-sm mb-6 leading-relaxed">
                    Select a template from the left library directory to view its contents, edit it, or use it. Alternatively, create a brand new template.
                  </p>
                  <Button onClick={handleCreateNewClick} size="sm" className="h-9 gap-2">
                    <Plus className="size-4" />
                    Create New Template
                  </Button>
                </motion.div>
              )
            ) : (
              // ──────────────────────────────────────── EDITING / CREATING PANEL ────────────────────────────────────────
              <motion.div
                key="edit-panel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border/40 px-6 py-4 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {isCreatingNew ? "Create New Template" : `Edit Template: ${name}`}
                      </CardTitle>
                      <CardDescription>
                        Draft template body in markdown. Wrap placeholders in double braces (e.g. `{"{{name}}"}`).
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="h-8 gap-2"
                      >
                        {isPreviewMode ? <Layout className="size-3.5" /> : <Eye className="size-3.5" />}
                        {isPreviewMode ? "Editor" : "Live Preview"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AnimatePresence mode="wait">
                      {!isPreviewMode ? (
                        <motion.div
                          key="form-editor"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4"
                        >
                          {/* Metadata row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="template-name">Template Name *</Label>
                              <Input
                                id="template-name"
                                placeholder="E.g., Connect first repository"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-10 border-border/40"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <SelectRoot
                                value={category}
                                onValueChange={(val) => setCategory(val as CategoryType)}
                              >
                                {CATEGORIES.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectRoot>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="template-desc">Internal Description</Label>
                            <Input
                              id="template-desc"
                              placeholder="E.g., Welcome email triggered when user has registered but not connected any repository."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="h-10 border-border/40"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="template-subject">Email Subject Line *</Label>
                            <Input
                              id="template-subject"
                              placeholder="E.g., Welcome, {{name}}! Let's connect your first repo"
                              value={subject}
                              onChange={(e) => setSubject(e.target.value)}
                              className="h-10 border-border/40 font-medium"
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="template-body">Email Body (Markdown) *</Label>
                              <span className="text-[10px] text-muted-foreground/60">
                                Placeholders: `{"{{name}}"}` · `{"{{email}}"}` · `{"{{appUrl}}"}`
                              </span>
                            </div>

                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-t-lg border border-border/40 bg-muted/50">
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("**", "**")} title="Bold">
                                <Bold className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("*", "*")} title="Italic">
                                <Italic className="size-4" />
                              </Button>
                              <div className="w-px h-4 bg-border/60 mx-1" />
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("# ", "")} title="H1">
                                <Heading1 className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("## ", "")} title="H2">
                                <Heading2 className="size-4" />
                              </Button>
                              <div className="w-px h-4 bg-border/60 mx-1" />
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("- ", "")} title="Bullet List">
                                <List className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("1. ", "")} title="Ordered List">
                                <ListOrdered className="size-4" />
                              </Button>
                              <div className="w-px h-4 bg-border/60 mx-1" />
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("[", "](url)")} title="Link">
                                <LinkIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("![Image](", ")")} title="Image">
                                <ImageIcon className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8" onClick={() => insertText("`", "`")} title="Inline Code">
                                <Code className="size-4" />
                              </Button>
                              <div className="w-px h-4 bg-border/60 mx-1" />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => insertText("{{name}}")}
                                className="h-7 px-2 text-[10px] font-mono rounded"
                                title="Insert Name Placeholder"
                              >
                                + name
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => insertText("{{appUrl}}")}
                                className="h-7 px-2 text-[10px] font-mono rounded"
                                title="Insert App URL Placeholder"
                              >
                                + appUrl
                              </Button>
                            </div>

                            <Textarea
                              id="template-body"
                              ref={textareaRef}
                              placeholder="Draft your personalized message body here. Markdown is fully supported..."
                              value={body}
                              onChange={(e) => setBody(e.target.value)}
                              className="min-h-[300px] font-mono text-sm leading-relaxed rounded-t-none border-t-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-border/40"
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="form-preview"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="space-y-4"
                        >
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Personalized Preview Rendering</span>
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded">
                              Live Mock View
                            </span>
                          </div>
                          
                          <div className="rounded-xl border border-border/40 bg-muted/20 p-8 min-h-[400px] overflow-auto">
                            <div className="max-w-[600px] mx-auto bg-white dark:bg-zinc-950 rounded-xl shadow-2xl p-8 border border-border/40">
                              <h2 className="text-xl font-bold mb-4 text-foreground">
                                {personalizeContent(subject) || "Subject Placeholder"}
                              </h2>
                              <p className="text-muted-foreground text-sm mb-4">Hi User,</p>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/80 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {personalizeContent(body) || "*Write template body content in the editor to see preview*"}
                                </ReactMarkdown>
                              </div>
                              <div className="mt-8 pt-4 border-t border-border/40 text-[10px] text-muted-foreground text-center">
                                Sent from CodeCatch · <span className="underline cursor-pointer">Unsubscribe</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t border-border/40 px-6 py-4 flex items-center justify-between gap-4">
                    <Button variant="ghost" size="sm" onClick={handleCancelClick} className="h-9">
                      Discard Changes
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelClick} className="h-9">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={createMutation.isPending || updateMutation.isPending || !name || !subject || !body}
                        className="px-6 h-9 shadow-md shadow-primary/10 bg-primary hover:bg-primary/90"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
                          <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="size-4 mr-2" />
                        )}
                        Save Template
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
