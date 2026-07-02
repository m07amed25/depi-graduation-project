import fs from "fs";
import path from "path";
import { ENFORCED_CAPABILITIES } from "./capabilities";

// Scan server-side source for checkFeature/hasFeature("<key>") usages.
function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "client") continue; // skip generated prisma client
      out.push(...collectFiles(full));
    } else if (full.endsWith(".ts") && !full.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

const SOURCE_DIRS = [
  path.join(__dirname, "..", "server"),
  path.join(__dirname, "..", "features"),
];

const source = SOURCE_DIRS.flatMap(collectFiles)
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

const gatedKeys = new Set<string>();
for (const m of source.matchAll(
  /(?:checkFeature|hasFeature)\([^)]*?["']([a-z0-9_]+)["']\s*,?\s*\)/g,
)) {
  gatedKeys.add(m[1]);
}

describe("capability enforcement contract", () => {
  it.each(ENFORCED_CAPABILITIES)(
    "enforced capability '%s' is gated by a checkFeature/hasFeature call",
    (key) => {
      expect(gatedKeys.has(key)).toBe(true);
    },
  );

  it("every gated key is a declared enforced capability (no typos/orphans)", () => {
    const declared = new Set<string>(ENFORCED_CAPABILITIES);
    const unknown = [...gatedKeys].filter((k) => !declared.has(k));
    expect(unknown).toEqual([]);
  });
});
