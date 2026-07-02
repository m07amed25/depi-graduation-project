import { classifyPlanChange, resolveExpiredSubscription } from "./payment-workflow";

const PRO = { planId: "pro", monthlyPrice: 2000 };
const ULTRA = { planId: "enterprise", monthlyPrice: 5000 };
const FREE = { planId: "free", monthlyPrice: 0 };

describe("classifyPlanChange", () => {
  it("free -> paid is upgrade", () => {
    expect(
      classifyPlanChange({ ...FREE, billingCycle: null }, { ...PRO, billingCycle: "monthly" }),
    ).toBe("upgrade");
  });

  it("paid -> free is cancel", () => {
    expect(
      classifyPlanChange({ ...PRO, billingCycle: "monthly" }, { ...FREE, billingCycle: "monthly" }),
    ).toBe("cancel");
  });

  it("pro -> enterprise is upgrade", () => {
    expect(
      classifyPlanChange({ ...PRO, billingCycle: "monthly" }, { ...ULTRA, billingCycle: "monthly" }),
    ).toBe("upgrade");
  });

  it("enterprise -> pro is downgrade", () => {
    expect(
      classifyPlanChange({ ...ULTRA, billingCycle: "monthly" }, { ...PRO, billingCycle: "monthly" }),
    ).toBe("downgrade");
  });

  it("same plan monthly -> yearly is upgrade", () => {
    expect(
      classifyPlanChange({ ...PRO, billingCycle: "monthly" }, { ...PRO, billingCycle: "yearly" }),
    ).toBe("upgrade");
  });

  it("same plan yearly -> monthly is downgrade", () => {
    expect(
      classifyPlanChange({ ...PRO, billingCycle: "yearly" }, { ...PRO, billingCycle: "monthly" }),
    ).toBe("downgrade");
  });

  it("same plan + cycle is current", () => {
    expect(
      classifyPlanChange({ ...PRO, billingCycle: "monthly" }, { ...PRO, billingCycle: "monthly" }),
    ).toBe("current");
  });

  it("free -> free is current", () => {
    expect(
      classifyPlanChange({ ...FREE, billingCycle: null }, { ...FREE, billingCycle: "monthly" }),
    ).toBe("current");
  });
});



describe("resolveExpiredSubscription", () => {
  const base = { id: "u1", pendingBillingCycle: "monthly" };

  it("paid pending downgrade that charges OK -> activated, no revert", async () => {
    const revertToFree = jest.fn();
    const chargeAndActivatePending = jest.fn().mockResolvedValue(true);
    const res = await resolveExpiredSubscription(
      { ...base, pendingPlanId: "pro" },
      { chargeAndActivatePending, revertToFree },
    );
    expect(res).toBe("activated");
    expect(chargeAndActivatePending).toHaveBeenCalledWith({ id: "u1" }, "pro", "monthly");
    expect(revertToFree).not.toHaveBeenCalled();
  });

  it("paid pending downgrade whose charge fails -> reverted to free", async () => {
    const revertToFree = jest.fn();
    const res = await resolveExpiredSubscription(
      { ...base, pendingPlanId: "pro" },
      { chargeAndActivatePending: jest.fn().mockResolvedValue(false), revertToFree },
    );
    expect(res).toBe("reverted");
    expect(revertToFree).toHaveBeenCalledWith("u1");
  });

  it("cancel (pending free) -> reverted without charging", async () => {
    const chargeAndActivatePending = jest.fn();
    const revertToFree = jest.fn();
    const res = await resolveExpiredSubscription(
      { ...base, pendingPlanId: "free" },
      { chargeAndActivatePending, revertToFree },
    );
    expect(res).toBe("reverted");
    expect(chargeAndActivatePending).not.toHaveBeenCalled();
    expect(revertToFree).toHaveBeenCalledWith("u1");
  });

  it("plain expiry (no pending) -> reverted to free", async () => {
    const chargeAndActivatePending = jest.fn();
    const revertToFree = jest.fn();
    const res = await resolveExpiredSubscription(
      { ...base, pendingPlanId: null },
      { chargeAndActivatePending, revertToFree },
    );
    expect(res).toBe("reverted");
    expect(chargeAndActivatePending).not.toHaveBeenCalled();
    expect(revertToFree).toHaveBeenCalledWith("u1");
  });
});
