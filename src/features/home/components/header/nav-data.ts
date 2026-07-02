import {
  GitPullRequest,
  Users,
  BarChart3,
  Shield,
  GitBranch,
  BookOpen,
  FileText,
  Activity,
  Radio,
  MessageSquare,
  Info,
  FolderGit2,
} from "lucide-react";

export const productLinks = [
  { href: "/product#review", label: "Code Review", icon: GitPullRequest, description: "AI-powered PR analysis" },
  { href: "/product#teams", label: "Teams", icon: Users, description: "Collaborate with your team" },
  { href: "/product#analytics", label: "Analytics", icon: BarChart3, description: "Insights and reporting" },
  { href: "/product#security", label: "Security", icon: Shield, description: "Vulnerability detection" },
  { href: "/product#diagrams", label: "Diagrams", icon: GitBranch, description: "Auto-generated architecture" },
];

export const resourceLinks = [
  { href: "/docs", label: "Documentation", icon: BookOpen, description: "Guides and API reference" },
  { href: "/blog", label: "Blog", icon: FileText, description: "Updates and articles" },
  { href: "/changelog", label: "Changelog", icon: Activity, description: "What's new" },
  { href: "/status", label: "Status", icon: Radio, description: "Service health" },
  { href: "/contact", label: "Contact", icon: MessageSquare, description: "Get in touch" },
];

export const simpleLinks = [
  { href: "/about", label: "About", icon: Info },
];

export const workspaceLinks = [
  { href: "/repo", label: "Repositories", icon: FolderGit2, description: "Browse all repositories" },
  { href: "/reviews", label: "Reviews", icon: GitPullRequest, description: "Your code reviews" },
  { href: "/teams", label: "Teams", icon: Users, description: "Your teams" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, description: "Insights and reporting" },
];
