"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { trpc } from "@/lib/trpc/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Newspaper, Send, Loader2, Users, Check, ImagePlus, Eye, EyeOff, X, Search, Palette, Type, Layout, Bold, Italic, Heading1, Heading2, Link2, List, ListOrdered, Minus, Quote, Code, Table, MousePointer2, LayoutTemplate, Info } from "lucide-react";
import { SelectItem, SelectRoot } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

type Target = "ALL" | "FREE" | "PRO" | "CUSTOM";

interface SelectedUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface EmailDesign {
  bgColor: string;
  containerBg: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  buttonBg: string;
  buttonTextColor: string;
  fontFamily: string;
  fontSize: string;
  headingSize: string;
  containerWidth: string;
  padding: string;
  borderRadius: string;
  logoPosition: "hidden" | "top" | "before-greeting" | "after-greeting";
  logoUrl: string;
  logoWidth: string;
  greetingText: string;
  showFooter: boolean;
  footerText: string;
  showUnsubscribe: boolean;
  headerImageUrl: string;
  footerImageUrl: string;
  bodyImages: string[];
}

const defaultDesign: EmailDesign = {
  bgColor: "#f6f9fc",
  containerBg: "#ffffff",
  textColor: "#444444",
  headingColor: "#1a1a1a",
  linkColor: "#2563eb",
  buttonBg: "#2563eb",
  buttonTextColor: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: "16px",
  headingSize: "24px",
  containerWidth: "600px",
  padding: "40px",
  borderRadius: "8px",
  logoPosition: "hidden",
  logoUrl: "",
  logoWidth: "56",
  greetingText: "Hi {name},",
  showFooter: true,
  footerText: "Sent from CodeCatch",
  showUnsubscribe: true,
  headerImageUrl: "",
  footerImageUrl: "",
  bodyImages: [],
};

const colorPresets = [
  { name: "Default", bgColor: "#f6f9fc", containerBg: "#ffffff", textColor: "#374151", headingColor: "#111827", linkColor: "#2563eb", buttonBg: "#2563eb" },
  { name: "Dark", bgColor: "#111827", containerBg: "#1f2937", textColor: "#e5e7eb", headingColor: "#f9fafb", linkColor: "#60a5fa", buttonBg: "#3b82f6" },
  { name: "Purple", bgColor: "#faf5ff", containerBg: "#ffffff", textColor: "#4b5563", headingColor: "#6b21a8", linkColor: "#9333ea", buttonBg: "#7c3aed" },
  { name: "Green", bgColor: "#f0fdf4", containerBg: "#ffffff", textColor: "#4b5563", headingColor: "#15803d", linkColor: "#16a34a", buttonBg: "#16a34a" },
  { name: "Orange", bgColor: "#fff7ed", containerBg: "#ffffff", textColor: "#4b5563", headingColor: "#c2410c", linkColor: "#ea580c", buttonBg: "#ea580c" },
  { name: "Ocean", bgColor: "#f0f9ff", containerBg: "#ffffff", textColor: "#475569", headingColor: "#0c4a6e", linkColor: "#0284c7", buttonBg: "#0369a1" },
  { name: "Midnight", bgColor: "#0f172a", containerBg: "#1e293b", textColor: "#cbd5e1", headingColor: "#f1f5f9", linkColor: "#38bdf8", buttonBg: "#0ea5e9" },
];

function NewsletterContent() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<Target>("ALL");
  const [forceSendAll, setForceSendAll] = useState(false);
  const [sent, setSent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [design, setDesign] = useState<EmailDesign>(defaultDesign);
  const [activeTab, setActiveTab] = useState<"content" | "design">("content");
  const [bodyImageInput, setBodyImageInput] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerFileRef = useRef<HTMLInputElement>(null);
  const footerFileRef = useRef<HTMLInputElement>(null);
  const bodyImageFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Template Library from DB
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  const { data: templates = [] } = trpc.admin.listTemplates.useQuery(undefined);

  useEffect(() => {
    if (templateIdParam && templates.length > 0) {
      const template = templates.find((t) => t.id === templateIdParam);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
        setSelectedTemplateId(template.id);
        toast.success(`Template "${template.name}" loaded!`);
      }
    }
  }, [templateIdParam, templates]);

  const handleTemplateSelect = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplateId(id);
      toast.success(`Loaded template: ${template.name}`);
    }
  };

  const userIds = selectedUsers.map((u) => u.id);
  const { data: count } = trpc.admin.recipientCount.useQuery({ target, userIds, forceSendAll });
  const { data: searchResults, isFetching: searching } = trpc.admin.searchUsers.useQuery(
    { search: userSearch },
    { enabled: userSearch.length >= 2 },
  );

  const sendMutation = trpc.admin.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setSubject("");
      setBody("");
      setTimeout(() => setSent(false), 5000);
    },
  });

  const updateDesign = (key: keyof EmailDesign, value: string | boolean) => {
    setDesign((prev) => ({ ...prev, [key]: value }));
  };

  const addBodyImage = () => {
    if (!bodyImageInput.trim()) return;
    setDesign((prev) => ({ ...prev, bodyImages: [...prev.bodyImages, bodyImageInput.trim()] }));
    setBodyImageInput("");
  };

  const removeBodyImage = (index: number) => {
    setDesign((prev) => ({ ...prev, bodyImages: prev.bodyImages.filter((_, i) => i !== index) }));
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    setDesign((prev) => ({
      ...prev,
      bgColor: preset.bgColor,
      containerBg: preset.containerBg,
      textColor: preset.textColor,
      headingColor: preset.headingColor,
      linkColor: preset.linkColor,
      buttonBg: preset.buttonBg,
    }));
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ?? null;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        const markdown = `![${file.name}](${url})\n`;
        const ta = textareaRef.current;
        if (ta) {
          const pos = ta.selectionStart ?? body.length;
          setBody(body.slice(0, pos) + markdown + body.slice(pos));
        } else {
          setBody(body + markdown);
        }
      }
    } catch {
      // silent fail
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDesignImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "headerImageUrl" | "footerImageUrl" | "logoUrl" | "bodyImage") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      if (url) {
        if (target === "bodyImage") {
          setDesign((prev) => ({ ...prev, bodyImages: [...prev.bodyImages, url] }));
        } else {
          updateDesign(target, url);
        }
      }
    } catch {
      // silent fail
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const insertAtCursor = (before: string, after = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);
    const insert = before + (selected || "text") + after;
    setBody(body.slice(0, start) + insert + body.slice(end));
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + (selected || "text").length;
    }, 0);
  };

  const insertBlock = (text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const prefix = pos > 0 && body[pos - 1] !== "\n" ? "\n" : "";
    setBody(body.slice(0, pos) + prefix + text + "\n" + body.slice(pos));
    setTimeout(() => { ta.focus(); }, 0);
  };

  const insertImageFromUrl = () => {
    const url = prompt("Image URL:");
    if (!url) return;
    const alt = prompt("Alt text (optional):") || "image";
    const width = prompt("Width (e.g. 400, 100%, or leave empty for auto):") || "";
    const md = width
      ? `<img src="${url}" alt="${alt}" width="${width}" />`
      : `![${alt}](${url})`;
    insertBlock(md);
  };

  const insertButton = () => {
    const text = prompt("Button text:") || "Click here";
    const url = prompt("Button URL:") || "https://";
    const color = prompt("Button color (hex, e.g. #2563eb):") || "#2563eb";
    insertBlock(`<a href="${url}" style="display:inline-block;padding:12px 24px;background:${color};color:#fff;border-radius:6px;text-decoration:none;font-weight:600">${text}</a>`);
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) return;
    sendMutation.mutate({
      subject,
      body,
      target,
      userIds: target === "CUSTOM" ? userIds : undefined,
      design,
      forceSendAll,
    });
  };

  const addUser = (user: SelectedUser) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearch("");
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const renderDesignInput = (label: string, key: keyof EmailDesign, type: "color" | "text" | "select" = "text", options?: { value: string; label: string }[]) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {type === "color" ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={design[key] as string}
            onChange={(e) => updateDesign(key, e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border"
          />
          <Input
            value={design[key] as string}
            onChange={(e) => updateDesign(key, e.target.value)}
            className="h-8 flex-1 font-mono text-xs"
          />
        </div>
      ) : type === "select" ? (
        <select
          value={design[key] as string}
          onChange={(e) => updateDesign(key, e.target.value)}
          className="flex h-8 w-full rounded-md border bg-background px-2 text-sm"
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <Input
          value={design[key] as string}
          onChange={(e) => updateDesign(key, e.target.value)}
          className="h-8"
        />
      )}
    </div>
  );

  const previewCard = (
    <Card className="lg:sticky lg:top-4 lg:self-start">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-auto rounded-lg shadow-sm"
          style={{ backgroundColor: design.bgColor, padding: "20px" }}
        >
          <div
            style={{
              backgroundColor: design.containerBg,
              maxWidth: design.containerWidth,
              margin: "0 auto",
              padding: design.padding,
              borderRadius: design.borderRadius,
              fontFamily: design.fontFamily,
              color: design.textColor,
              fontSize: design.fontSize,
            }}
          >
            {design.headerImageUrl && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <img src={design.headerImageUrl} alt="Header" style={{ width: "100%", height: "auto", borderRadius: design.borderRadius }} />
              </div>
            )}
            {design.logoPosition === "top" && design.logoUrl && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <img src={design.logoUrl} alt="Logo" style={{ width: `${design.logoWidth}px`, height: "auto", margin: "0 auto" }} />
              </div>
            )}
            {design.logoPosition === "before-greeting" && design.logoUrl && design.greetingText && (
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <img src={design.logoUrl} alt="Logo" style={{ width: `${design.logoWidth}px`, height: "auto", margin: "0 auto 8px" }} />
              </div>
            )}
            {design.greetingText && (
              <p style={{ fontSize: design.headingSize, fontWeight: 600, color: design.headingColor, marginBottom: "16px" }}>
                {design.greetingText.replace("{name}", "User")}
              </p>
            )}
            {design.logoPosition === "after-greeting" && design.logoUrl && (
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <img src={design.logoUrl} alt="Logo" style={{ width: `${design.logoWidth}px`, height: "auto", margin: "0 auto" }} />
              </div>
            )}
            {design.bodyImages.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px", justifyContent: "center" }}>
                {design.bodyImages.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ maxHeight: "48px", width: "auto" }} />
                ))}
              </div>
            )}
            <div className="prose prose-sm max-w-none" style={{ color: design.textColor }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ children }) => <h1 style={{ color: design.headingColor, fontSize: design.headingSize }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ color: design.headingColor }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ color: design.headingColor }}>{children}</h3>,
                  a: ({ href, children }) => <a href={href} style={{ color: design.linkColor }}>{children}</a>,
                  p: ({ children }) => <p style={{ marginBottom: "12px" }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                  li: ({ children }) => <li>{children}</li>,
                  img: ({ src, alt, ...props }) => <img src={src} alt={alt || ""} style={{ maxWidth: "100%", height: "auto", borderRadius: "6px", margin: "12px 0" }} {...props} />,
                  hr: () => <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />,
                }}
              >
                {body || "*No content*"}
              </ReactMarkdown>
            </div>
            {design.showFooter && (
              <div style={{ borderTop: "1px solid #e5e7eb", marginTop: "24px", paddingTop: "16px" }}>
                {design.footerImageUrl && (
                  <div style={{ textAlign: "center", marginBottom: "12px" }}>
                    <img src={design.footerImageUrl} alt="Footer" style={{ width: "100%", height: "auto" }} />
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>{design.footerText}</p>
                {design.showUnsubscribe && (
                  <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                    <a href="#" style={{ color: design.linkColor }}>Unsubscribe</a> · Manage preferences
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
            <Newspaper className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
            <p className="text-sm text-muted-foreground">Design and send emails to users</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {count ?? "..."} recipients
        </Badge>
      </div>

      {sent && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="h-4 w-4" />
          Newsletter queued successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "content" ? "bg-background shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab("design")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "design" ? "bg-background shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Design
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === "content" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {/* Template Library */}
            {templates.length > 0 && (
              <Card className="border-indigo-500/20 bg-indigo-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-indigo-500 animate-pulse" />
                    Template Library
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Load a saved template</Label>
                    <SelectRoot
                      value={selectedTemplateId}
                      onValueChange={handleTemplateSelect}
                      placeholder="Select a template..."
                    >
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectRoot>
                  </div>
                  <div className="flex gap-2 rounded bg-muted/40 border border-border/30 p-2">
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Loading a template will overwrite current subject and body fields.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["ALL", "FREE", "PRO", "CUSTOM"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTarget(t)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        target === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t === "ALL" ? "All Users" : t === "FREE" ? "Free Plan" : t === "PRO" ? "Pro & Ultra" : "Custom"}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceSendAll}
                    onChange={(e) => setForceSendAll(e.target.checked)}
                    className="rounded border-border"
                  />
                  Force send to all (include unsubscribed users)
                </label>

                {target === "CUSTOM" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users..."
                        className="pl-9"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                      {userSearch.length >= 2 && searchResults && searchResults.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover shadow-lg">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                              onClick={() => addUser(user)}
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.image ?? undefined} />
                                <AvatarFallback className="text-xs">{user.name?.[0] ?? user.email[0]}</AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm">{user.name ?? user.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUsers.map((user) => (
                          <Badge key={user.id} variant="secondary" className="gap-1 py-0.5 pl-2 pr-1 text-xs">
                            {user.name ?? user.email}
                            <button type="button" onClick={() => removeUser(user.id)} className="rounded-full p-0.5 hover:bg-muted-foreground/20">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What's new at Code Catch..."
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Body (Markdown + HTML)</Label>
                  </div>
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-0.5 rounded-md border bg-muted/50 p-1">
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Bold" onClick={() => insertAtCursor("**", "**")}>
                      <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Italic" onClick={() => insertAtCursor("*", "*")}>
                      <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <div className="mx-0.5 w-px bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Heading 1" onClick={() => insertBlock("# Heading")}>
                      <Heading1 className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Heading 2" onClick={() => insertBlock("## Heading")}>
                      <Heading2 className="h-3.5 w-3.5" />
                    </Button>
                    <div className="mx-0.5 w-px bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Bullet List" onClick={() => insertBlock("- Item 1\n- Item 2\n- Item 3")}>
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Numbered List" onClick={() => insertBlock("1. Item 1\n2. Item 2\n3. Item 3")}>
                      <ListOrdered className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Blockquote" onClick={() => insertBlock("> Quote")}>
                      <Quote className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Code" onClick={() => insertAtCursor("`", "`")}>
                      <Code className="h-3.5 w-3.5" />
                    </Button>
                    <div className="mx-0.5 w-px bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Link" onClick={() => { const url = prompt("URL:") || "https://"; insertAtCursor("[", `](${url})`); }}>
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Upload Image" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Image from URL" onClick={insertImageFromUrl}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <div className="mx-0.5 w-px bg-border" />
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Divider" onClick={() => insertBlock("\n---\n")}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" title="Table" onClick={() => insertBlock("| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |")}>
                      <Table className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-1.5" title="CTA Button" onClick={insertButton}>
                      <MousePointer2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={"# Hello!\n\nWe have exciting news...\n\n![banner](https://...)\n\n- Feature 1\n- Feature 2\n\n<img src=\"...\" width=\"300\" />\n\n[Learn more](https://example.com)"}
                    rows={16}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    disabled={!body.trim()}
                    className="gap-2"
                  >
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPreview ? "Hide" : "Preview"}
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!subject.trim() || !body.trim() || sendMutation.isPending}
                    className="gap-2"
                  >
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          {showPreview && previewCard}
        </div>
      )}

      {/* Design Tab */}
      {activeTab === "design" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Color Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Presets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex -space-x-1">
                    <div className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: preset.bgColor }} />
                    <div className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: preset.containerBg }} />
                    <div className="h-5 w-5 rounded-full border-2 border-white" style={{ backgroundColor: preset.buttonBg }} />
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Colors</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {renderDesignInput("Background", "bgColor", "color")}
              {renderDesignInput("Container", "containerBg", "color")}
              {renderDesignInput("Text", "textColor", "color")}
              {renderDesignInput("Headings", "headingColor", "color")}
              {renderDesignInput("Links", "linkColor", "color")}
              {renderDesignInput("Button", "buttonBg", "color")}
              {renderDesignInput("Button Text", "buttonTextColor", "color")}
            </CardContent>
          </Card>

          {/* Typography & Layout */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderDesignInput("Font Family", "fontFamily", "select", [
                  { value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", label: "System" },
                  { value: "Georgia, serif", label: "Georgia" },
                  { value: "'Courier New', monospace", label: "Monospace" },
                  { value: "Arial, sans-serif", label: "Arial" },
                ])}
                {renderDesignInput("Font Size", "fontSize", "select", [
                  { value: "14px", label: "Small (14px)" },
                  { value: "16px", label: "Medium (16px)" },
                  { value: "18px", label: "Large (18px)" },
                ])}
                {renderDesignInput("Heading Size", "headingSize", "select", [
                  { value: "20px", label: "Small (20px)" },
                  { value: "24px", label: "Medium (24px)" },
                  { value: "28px", label: "Large (28px)" },
                  { value: "32px", label: "XL (32px)" },
                ])}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderDesignInput("Width", "containerWidth", "select", [
                  { value: "480px", label: "Narrow (480px)" },
                  { value: "600px", label: "Standard (600px)" },
                  { value: "680px", label: "Wide (680px)" },
                ])}
                {renderDesignInput("Padding", "padding", "select", [
                  { value: "24px", label: "Compact (24px)" },
                  { value: "40px", label: "Standard (40px)" },
                  { value: "56px", label: "Spacious (56px)" },
                ])}
                {renderDesignInput("Border Radius", "borderRadius", "select", [
                  { value: "0px", label: "None" },
                  { value: "8px", label: "Small (8px)" },
                  { value: "16px", label: "Medium (16px)" },
                  { value: "24px", label: "Large (24px)" },
                ])}
              </CardContent>
            </Card>
          </div>

          {/* Header & Footer */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Header & Logo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label className="text-xs">Header Image (appears first)</Label>
                <div className="flex gap-1">
                  <Input
                    value={design.headerImageUrl}
                    onChange={(e) => updateDesign("headerImageUrl", e.target.value)}
                    placeholder="Header image URL (optional)"
                    className="h-8 text-sm"
                  />
                  <input ref={headerFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, "headerImageUrl")} />
                  <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => headerFileRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {renderDesignInput("Logo Position", "logoPosition", "select", [
                  { value: "hidden", label: "Hidden" },
                  { value: "top", label: "Top (above all)" },
                  { value: "before-greeting", label: "Before Greeting" },
                  { value: "after-greeting", label: "After Greeting" },
                ])}
                {design.logoPosition !== "hidden" && (
                  <div className="flex gap-1">
                    <Input
                      value={design.logoUrl}
                      onChange={(e) => updateDesign("logoUrl", e.target.value)}
                      placeholder="Logo URL (empty = default)"
                      className="h-8 text-sm"
                    />
                    <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, "logoUrl")} />
                    <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => logoFileRef.current?.click()} disabled={uploading}>
                      <ImagePlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Greeting Text</Label>
                <Input
                  value={design.greetingText}
                  onChange={(e) => updateDesign("greetingText", e.target.value)}
                  placeholder="Hi {name},"
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">Use {"{name}"} for user&apos;s name</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Footer Image</Label>
                <div className="flex gap-1">
                  <Input
                    value={design.footerImageUrl}
                    onChange={(e) => updateDesign("footerImageUrl", e.target.value)}
                    placeholder="Footer image URL (optional)"
                    className="h-8 text-sm"
                  />
                  <input ref={footerFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, "footerImageUrl")} />
                  <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => footerFileRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Images/Icons */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Body Images & Icons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={bodyImageInput}
                  onChange={(e) => setBodyImageInput(e.target.value)}
                  placeholder="Image or icon URL"
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBodyImage())}
                />
                <Button type="button" size="sm" variant="outline" className="h-8" onClick={addBodyImage}>
                  Add
                </Button>
                <input ref={bodyImageFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleDesignImageUpload(e, "bodyImage")} />
                <Button type="button" size="sm" variant="outline" className="h-8 px-2" onClick={() => bodyImageFileRef.current?.click()} disabled={uploading}>
                  <ImagePlus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {design.bodyImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {design.bodyImages.map((url, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
                      <img src={url} alt="" className="h-6 w-6 rounded object-cover" />
                      <span className="max-w-[120px] truncate text-xs">{url}</span>
                      <button type="button" onClick={() => removeBodyImage(i)} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">These images/icons will appear between the greeting and body content.</p>
            </CardContent>
          </Card>

          {/* Footer Settings */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Footer Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={design.showFooter}
                    onChange={(e) => updateDesign("showFooter", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Footer</span>
                </label>
                {design.showFooter && (
                  <Input
                    value={design.footerText}
                    onChange={(e) => updateDesign("footerText", e.target.value)}
                    placeholder="Sent from..."
                    className="h-8"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={design.showUnsubscribe}
                    onChange={(e) => updateDesign("showUnsubscribe", e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Show Unsubscribe Link</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Preview in Design Tab */}
          <div className="lg:col-span-3">
            {previewCard}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNewsletterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewsletterContent />
    </Suspense>
  );
}
