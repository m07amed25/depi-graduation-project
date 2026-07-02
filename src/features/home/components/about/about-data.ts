import {
  Zap,
  Shield,
  Lightbulb,
  Heart,
  Globe,
  Lock,
  Target,
  Code2,
  Rocket,
  Users,
} from "lucide-react";

export const values = [
  { icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "group-hover:border-amber-400/30", shadow: "group-hover:shadow-amber-400/15", title: "Speed Without Compromise", description: "Reviews should land before the developer switches context. We obsess over latency so feedback is always instant." },
  { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "group-hover:border-emerald-400/30", shadow: "group-hover:shadow-emerald-400/15", title: "Security First", description: "Every PR is scanned against OWASP Top-10 and CVE databases. Shipping insecure code is not an option." },
  { icon: Lightbulb, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "group-hover:border-indigo-400/30", shadow: "group-hover:shadow-indigo-400/15", title: "Actionable Insight", description: "Comments include context, suggested fixes, and links to best practices — not just a lint warning." },
  { icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10", border: "group-hover:border-pink-400/30", shadow: "group-hover:shadow-pink-400/15", title: "Developer Love", description: "We are developers ourselves. Every UX decision is made by people who have felt the pain of bad tooling." },
  { icon: Globe, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "group-hover:border-cyan-400/30", shadow: "group-hover:shadow-cyan-400/15", title: "Inclusive by Default", description: "From solo open-source maintainers to enterprise teams — our tooling scales to fit every workflow." },
  { icon: Lock, color: "text-violet-400", bg: "bg-violet-400/10", border: "group-hover:border-violet-400/30", shadow: "group-hover:shadow-violet-400/15", title: "Privacy You Can Trust", description: "Your source code never trains our models. We process, review, then discard — your IP stays yours." },
];

export const milestones = [
  { year: "2024", title: "The Problem", description: "After shipping several products we kept hitting the same wall: code review bottlenecks killing sprint velocity. Manual reviews were slow, inconsistent, and constantly blocked by the same recurring issues.", icon: Target, color: "text-rose-400", dotColor: "bg-rose-400" },
  { year: "Late 2025", title: "The Experiment", description: "We wired LLM APIs into a GitHub webhook to auto-comment on PRs. The prototype was rough but the signal was unmistakable — reviewers spent 60 % less time on structural issues and focused entirely on logic.", icon: Code2, color: "text-amber-400", dotColor: "bg-amber-400" },
  { year: "Early 2026", title: "Code Catch is Born", description: "We rebuilt everything from scratch with security scanning, multi-language support, team dashboards, and a real-time notification layer. The MVP shipped to our first 50 beta testers.", icon: Rocket, color: "text-indigo-400", dotColor: "bg-indigo-400" },
  { year: "2026 →", title: "Growing with the Community", description: "Hundreds of developers and teams joined. We listen to every feature request, fix every edge case, and ship improvements every week. The mission is simple: make every codebase a safer, higher-quality place.", icon: Users, color: "text-emerald-400", dotColor: "bg-emerald-400" },
];

export interface TeamMember {
  name: string;
  role: string;
  github: string;
  githubPhoto: string;
  description: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export const team: TeamMember[] = [
  { name: "Mohamed Reda", role: "Founder & Lead Engineer", github: "https://github.com/m07amed25", githubPhoto: "https://avatars.githubusercontent.com/m07amed25", description: "Architects the platform end-to-end — from backend APIs and AI pipelines to the interfaces developers interact with every day.", twitter: "https://x.com/m07hamed25", instagram: "https://www.instagram.com/m07amedr", facebook: "https://www.facebook.com/Mohamed.reda.lll/", linkedin: "https://www.linkedin.com/in/mhmd-reda-ali/" },
  { name: "Mohamed Ramy", role: "ML & AI Engineer", github: "https://github.com/ramymod", githubPhoto: "https://avatars.githubusercontent.com/ramymod", description: "Designs and fine-tunes the AI models that power Code Catch's code analysis, making reviews smarter with every PR." },
  { name: "Mostafa Galal", role: "Cross Platform Mobile Developer", github: "https://github.com/MG-B17", githubPhoto: "https://avatars.githubusercontent.com/MG-B17", description: "Builds native-quality apps for iOS and Android from a single codebase, keeping performance tight on every device." },
  { name: "Shahd Arman", role: "Flutter dev & Video Editor", github: "https://github.com/shahdarman", githubPhoto: "https://avatars.githubusercontent.com/shahdarman", description: "Crafts smooth cross-platform mobile experiences and produces the visual content that brings Code Catch's story to life.", linkedin: "https://www.linkedin.com/in/shahdarman" },
  { name: "Salma Tarek", role: "UI & UX designer", github: "https://github.com/Salma935", githubPhoto: "https://avatars.githubusercontent.com/Salma935", description: "Translates complex workflows into clean, intuitive interfaces — ensuring every interaction feels effortless and intentional." },
  { name: "Yassmin Ghaly", role: "Security & Graphic Designer", github: "https://github.com/Yassmin-Ghaly001", githubPhoto: "https://avatars.githubusercontent.com/Yassmin-Ghaly001", description: "Keeps the platform secure from threats while shaping the visual identity that makes Code Catch recognizable and trustworthy." },
];
