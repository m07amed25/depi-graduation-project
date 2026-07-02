export { LANGUAGE_MAP, BASENAME_MAP } from "@/lib/constants";
import { LANGUAGE_MAP, BASENAME_MAP } from "@/lib/constants";

const LANG_BLUE = "bg-blue-500/15 text-blue-600 dark:text-blue-400";
const LANG_PINK = "bg-pink-500/15 text-pink-600 dark:text-pink-400";
const LANG_PURPLE = "bg-purple-500/15 text-purple-600 dark:text-purple-400";

export function getLanguageInfo(
  filename: string,
): { lang: string; color: string } | null {
  const basename = filename.split("/").pop()?.toLowerCase() || "";
  if (BASENAME_MAP[basename]) return BASENAME_MAP[basename];
  if (basename.startsWith("dockerfile"))
    return { lang: "Docker", color: LANG_BLUE };
  const ext = basename.split(".").pop()?.toLowerCase();
  if (ext && LANGUAGE_MAP[ext]) return LANGUAGE_MAP[ext];
  const parts = basename.split(".");
  if (parts.length >= 3) {
    const secondExt = parts[parts.length - 2]?.toLowerCase();
    if (secondExt === "stories" || secondExt === "story")
      return { lang: "Storybook", color: LANG_PINK };
    if (secondExt === "test" || secondExt === "spec")
      return ext ? LANGUAGE_MAP[ext] || null : null;
    if (secondExt === "module" && ext === "css")
      return { lang: "CSS Module", color: LANG_PURPLE };
    if (secondExt === "d" && ext === "ts")
      return { lang: "TypeScript Decl", color: LANG_BLUE };
  }
  return null;
}
