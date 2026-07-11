/**
 * src/lib/api/admin.functions.ts
 * Admin-only server functions — real data for dashboard, users, analytics
 * All functions verify admin role via profiles table before querying
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { getRequestHeader } from "@tanstack/react-start/server";

function getSupabase() {
  const cookieHeader = getRequestHeader("cookie") ?? "";
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(cookieHeader)
            .filter((c) => c.value !== undefined)
            .map((c) => ({ name: c.name, value: c.value as string }));
        },
        setAll() {},
      },
    }
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function assertAdmin(supabase: ReturnType<typeof getSupabase>, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getDashboardStats — top-level numbers + recent activity table
// ─────────────────────────────────────────────────────────────────────────────
export const getDashboardStats = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();

    // Total users
    const { count: totalUsers } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonth } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString());

    // Active paid subscriptions
    const { count: activeSubscriptions } = await admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "pro")
      .eq("status", "active")
      .gt("plan_expires_at", new Date().toISOString());

    // Total content generated
    const { count: totalGenerated } = await admin
      .from("content_generations")
      .select("*", { count: "exact", head: true })
      .not("generated_text", "is", null)
      .neq("generated_text", "");

    // Activity in last 24 hours
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: activity24h } = await admin
      .from("content_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h);

    // Recent users with their plan + generation count
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentActivity = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("plan, plan_expires_at")
          .eq("user_id", p.id)
          .single();

        const { count: gens } = await admin
          .from("content_generations")
          .select("*", { count: "exact", head: true })
          .eq("user_id", p.id)
          .not("generated_text", "is", null)
          .neq("generated_text", "");

        const isPro = sub?.plan === "pro" && sub?.plan_expires_at && new Date(sub.plan_expires_at) > new Date();

        return {
          name:     p.full_name ?? p.email ?? "Unknown",
          email:    p.email ?? "",
          plan:     isPro ? "Pro" : "Free",
          gens:     gens ?? 0,
          joinedAt: p.created_at,
        };
      })
    );

    return {
      totalUsers:          totalUsers ?? 0,
      newThisMonth:        newThisMonth ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      totalGenerated:      totalGenerated ?? 0,
      activity24h:         activity24h ?? 0,
      recentActivity,
    };
  });

// ─────────────────────────────────────────────────────────────────────────────
// 2. getAllUsers — full user list with plan + generation count
// ─────────────────────────────────────────────────────────────────────────────
export const getAllUsers = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false });

    const users = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { data: sub } = await admin
          .from("subscriptions")
          .select("plan, status, plan_expires_at, generations_used")
          .eq("user_id", p.id)
          .single();

        const isPro = sub?.plan === "pro" && sub?.plan_expires_at && new Date(sub.plan_expires_at) > new Date();

        return {
          id:          p.id,
          name:        p.full_name ?? "—",
          email:       p.email ?? "—",
          plan:        isPro ? "Pro" : "Free",
          status:      isPro ? "Active" : (sub ? "Free" : "Trial"),
          gens:        sub?.generations_used ?? 0,
          joined:      p.created_at,
        };
      })
    );

    return users;
  });

// ─────────────────────────────────────────────────────────────────────────────
// 3. getContentAnalytics — breakdown by content type + totals
// ─────────────────────────────────────────────────────────────────────────────
export const getContentAnalytics = createServerFn({ method: "GET" })
  .handler(async () => {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");
    await assertAdmin(supabase, user.id);

    const admin = getSupabaseAdmin();

    // Total all-time
    const { count: totalAllTime } = await admin
      .from("content_generations")
      .select("*", { count: "exact", head: true })
      .not("generated_text", "is", null)
      .neq("generated_text", "");

    // This week
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: thisWeek } = await admin
      .from("content_generations")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since7d)
      .not("generated_text", "is", null)
      .neq("generated_text", "");

    // Avg per user
    const { count: totalUsers } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const avgPerUser = totalUsers && totalAllTime
      ? (totalAllTime / totalUsers).toFixed(1)
      : "0";

    // Breakdown by content_type (adjust field name if different in your DB)
    const { data: rows } = await admin
      .from("content_generations")
      .select("content_type")
      .not("generated_text", "is", null)
      .neq("generated_text", "");

    const typeCounts: Record<string, number> = {};
    for (const row of rows ?? []) {
      const t = (row as any).content_type ?? "Unknown";
      typeCounts[t] = (typeCounts[t] ?? 0) + 1;
    }

    const total = Object.values(typeCounts).reduce((a, b) => a + b, 0) || 1;
    const byType = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        pct: Math.round((value / total) * 100),
      }));

    return {
      totalAllTime: totalAllTime ?? 0,
      thisWeek:     thisWeek ?? 0,
      avgPerUser,
      byType,
    };
  });