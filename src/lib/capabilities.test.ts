import { decideCapability, checkFeature, hasFeature } from "./capabilities";

describe("decideCapability", () => {
  it("allows when the capability is not in the catalog", () => {
    expect(decideCapability(null, null).allowed).toBe(true);
  });
  it("denies when the capability exists but has no assignment", () => {
    expect(decideCapability({ label: "X" }, null).allowed).toBe(false);
  });
  it("denies when the assignment is disabled", () => {
    expect(decideCapability({ label: "X" }, { enabled: false }).allowed).toBe(false);
  });
  it("allows when the assignment is enabled", () => {
    expect(decideCapability({ label: "X" }, { enabled: true }).allowed).toBe(true);
  });
});

const CAP = { id: "c1", label: "Private repositories" };

function mockDb(opts: {
  planId?: string;
  planExpiresAt?: Date | null;
  capability?: { id: string; label: string } | null;
  byPlan?: Record<string, { enabled: boolean }>;
}) {
  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(
        opts.planId === undefined
          ? null
          : { planId: opts.planId, planExpiresAt: opts.planExpiresAt ?? null },
      ),
    },
    capability: {
      findUnique: jest.fn().mockResolvedValue(opts.capability ?? null),
    },
    planCapability: {
      findUnique: jest.fn().mockImplementation((args: { where: { planId_capabilityId: { planId: string } } }) =>
        Promise.resolve(opts.byPlan?.[args.where.planId_capabilityId.planId] ?? null),
      ),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("checkFeature", () => {
  it("passes when the capability is enabled for the plan", async () => {
    const db = mockDb({ planId: "pro", capability: CAP, byPlan: { pro: { enabled: true } } });
    await expect(checkFeature(db, "u1", "private_repos")).resolves.toEqual({ allowed: true });
  });

  it("throws FORBIDDEN when disabled for the plan", async () => {
    const db = mockDb({ planId: "free", capability: CAP, byPlan: { free: { enabled: false } } });
    await expect(checkFeature(db, "u1", "private_repos")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN when there is no assignment row", async () => {
    const db = mockDb({ planId: "free", capability: CAP, byPlan: {} });
    await expect(checkFeature(db, "u1", "private_repos")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("treats an expired plan as free", async () => {
    const db = mockDb({
      planId: "pro",
      planExpiresAt: new Date(Date.now() - 1000),
      capability: CAP,
      byPlan: { pro: { enabled: true }, free: { enabled: false } },
    });
    await expect(checkFeature(db, "u1", "private_repos")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an unknown capability key", async () => {
    const db = mockDb({ planId: "free", capability: null });
    await expect(checkFeature(db, "u1", "ghost")).resolves.toEqual({ allowed: true });
  });

  it("throws NOT_FOUND when the user is missing", async () => {
    const db = mockDb({});
    await expect(checkFeature(db, "u1", "private_repos")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});


describe("hasFeature", () => {
  it("returns true when enabled for the plan", async () => {
    const db = mockDb({ planId: "pro", capability: CAP, byPlan: { pro: { enabled: true } } });
    await expect(hasFeature(db, "u1", "pr_inline_comments")).resolves.toBe(true);
  });

  it("returns false when disabled for the plan", async () => {
    const db = mockDb({ planId: "free", capability: CAP, byPlan: {} });
    await expect(hasFeature(db, "u1", "pr_inline_comments")).resolves.toBe(false);
  });

  it("returns true for an unknown capability key", async () => {
    const db = mockDb({ planId: "free", capability: null });
    await expect(hasFeature(db, "u1", "ghost")).resolves.toBe(true);
  });

  it("returns false when the user is missing", async () => {
    const db = mockDb({});
    await expect(hasFeature(db, "u1", "pr_inline_comments")).resolves.toBe(false);
  });
});
