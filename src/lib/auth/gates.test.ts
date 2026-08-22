import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveAuthRedirect } from "./gates";

describe("resolveAuthRedirect — production (Supabase configured)", () => {
  it("ignores the demo cookie and requires a Supabase user for /portal", () => {
    const redirect = resolveAuthRedirect({
      path: "/portal",
      supabaseConfigured: true,
      demoSession: "employee",
      userId: null,
      role: null,
    });
    assert.deepEqual(redirect, { pathname: "/portal/login", next: "/portal" });
  });

  it("sends unauthenticated /operations traffic to the employee door", () => {
    const redirect = resolveAuthRedirect({
      path: "/operations",
      supabaseConfigured: true,
      demoSession: "employee",
      userId: null,
    });
    assert.deepEqual(redirect, {
      pathname: "/operations/login",
      next: "/operations",
    });
  });

  it("lets customers open /portal/login and /portal when signed in", () => {
    assert.equal(
      resolveAuthRedirect({
        path: "/portal/login",
        supabaseConfigured: true,
        userId: null,
      }),
      null
    );
    assert.equal(
      resolveAuthRedirect({
        path: "/portal",
        supabaseConfigured: true,
        userId: "user-1",
        role: "customer",
      }),
      null
    );
  });

  it("bounces a signed-in customer off /operations and /operations/login to /portal", () => {
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: true,
        userId: "user-1",
        role: "customer",
      }),
      { pathname: "/portal" }
    );
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations/login",
        supabaseConfigured: true,
        userId: "user-1",
        role: "customer",
      }),
      { pathname: "/portal" }
    );
  });

  it("lets employees use /operations and lands them there from the employee door", () => {
    assert.equal(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: true,
        userId: "emp-1",
        role: "employee",
      }),
      null
    );
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations/login",
        supabaseConfigured: true,
        userId: "emp-1",
        role: "employee",
      }),
      { pathname: "/operations" }
    );
  });

  it("does not treat a demo cookie as auth when Supabase env is set", () => {
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: true,
        demoSession: "employee",
        userId: null,
      }),
      { pathname: "/operations/login", next: "/operations" }
    );
  });
});

describe("resolveAuthRedirect — local preview (Supabase unset)", () => {
  it("keeps demo cookie gates for /portal and /operations", () => {
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/portal",
        supabaseConfigured: false,
      }),
      { pathname: "/portal/login", next: "/portal" }
    );
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: false,
        demoSession: "customer",
      }),
      { pathname: "/portal" }
    );
    assert.equal(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: false,
        demoSession: "employee",
      }),
      null
    );
  });

  it("leaves both login doors open without a session", () => {
    assert.equal(
      resolveAuthRedirect({
        path: "/portal/login",
        supabaseConfigured: false,
      }),
      null
    );
    assert.equal(
      resolveAuthRedirect({
        path: "/operations/login",
        supabaseConfigured: false,
      }),
      null
    );
  });

  it("sends anonymous /operations traffic to the employee door", () => {
    assert.deepEqual(
      resolveAuthRedirect({
        path: "/operations",
        supabaseConfigured: false,
      }),
      { pathname: "/operations/login", next: "/operations" }
    );
  });
});
