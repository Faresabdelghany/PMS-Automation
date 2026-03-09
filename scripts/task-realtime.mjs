/**
 * task-realtime.mjs — Supabase Realtime listener for the todos table.
 * When a new task is inserted or an existing task is updated to status=todo
 * with a valid agent assignee and no claim, it sends a webhook to OpenClaw
 * to wake Ziko for dispatch.
 *
 * Usage: node task-realtime.mjs
 * Runs as a long-lived process. Pair with heartbeat polling for resilience.
 */

import { createClient } from "@supabase/supabase-js";
import { exec } from "node:child_process";

const SUPABASE_URL = "https://uvqnrysmjpyupkhtnyfd.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cW5yeXNtanB5dXBraHRueWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTc1NzUsImV4cCI6MjA4ODMzMzU3NX0.hBrPgN_8zgRq6bSwqkOmz1T3QYV1PuhWYtC-h2D_iYo";

const OPENCLAW_HOOK = "http://localhost:18789/hooks/wake";
const OPENCLAW_TOKEN = process.env.OPENCLAW_HOOKS_TOKEN || "";

const VALID_AGENTS = new Set([
  "Ziko",
  "Product Analyst",
  "Dev",
  "Testing Agent",
  "Code Reviewer",
  "Designer",
  "Marketing Agent",
  "Job Search Agent",
]);

function classifyIntent(title = "") {
  const t = title.toLowerCase();
  if (t.match(/design|ui|ux|figma|layout|mockup/)) return { assignee: "Designer", stage: "SPECIALIST", category: "Work" };
  if (t.match(/test|qa|bug|regression|unit test|integration test/)) return { assignee: "Testing Agent", stage: "TEST", category: "Development" };
  if (t.match(/review|audit|security|code review/)) return { assignee: "Code Reviewer", stage: "REVIEW", category: "Development" };
  if (t.match(/marketing|seo|copy|launch|campaign|newsletter/)) return { assignee: "Marketing Agent", stage: "SPECIALIST", category: "Marketing" };
  if (t.match(/job|apply|resume|cv|interview/)) return { assignee: "Job Search Agent", stage: "SPECIALIST", category: "Work" };
  if (t.match(/research|spec|requirements|analysis|plan/)) return { assignee: "Product Analyst", stage: "PA", category: "Work" };
  if (t.match(/build|implement|feature|refactor|api|backend|frontend|fix|bugfix|ship/)) return { assignee: "Dev", stage: "DEV", category: "Development" };
  return { assignee: "Ziko", stage: "SPECIALIST", category: "Work" };
}

async function autoAssign(row) {
  const { assignee, stage, category } = classifyIntent(row.title || "");
  if (row.assignee !== assignee || row.workflow_stage !== stage || row.category !== category) {
    const { error } = await supabase
      .from("todos")
      .update({ assignee, workflow_stage: stage, category })
      .eq("id", row.id);
    if (error) console.error("[realtime] auto-assign update failed:", error.message);
  }
}

function autoDispatch() {
  const cmd = "powershell -ExecutionPolicy Bypass -File \"C:\\Users\\Fares\\.openclaw\\workspace\\scripts\\task-watcher.ps1\"";
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("[realtime] auto-dispatch failed:", err.message);
      return;
    }
    if (stderr) console.error("[realtime] auto-dispatch stderr:", stderr);
    if (stdout) console.log("[realtime] auto-dispatch:", stdout.trim());
  });
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function isDispatchable(row) {
  return (
    row.status === "todo" &&
    row.assignee &&
    VALID_AGENTS.has(row.assignee) &&
    !row.claimed_by
  );
}

async function wakeZiko(task) {
  const msg = `🆕 New task in queue: "${task.title}" — assigned to ${task.assignee} (priority: ${task.priority || "none"}, category: ${task.category || "none"}). Auto-dispatch attempted; run task-watcher if needed.`;

  console.log(`[realtime] Waking Ziko: ${task.title}`);

  try {
    const res = await fetch(OPENCLAW_HOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
      },
      body: JSON.stringify({ message: msg }),
    });

    if (!res.ok) {
      console.error(`[realtime] Wake failed: ${res.status} ${await res.text()}`);
    } else {
      console.log(`[realtime] Ziko woken successfully`);
    }
  } catch (err) {
    console.error(`[realtime] Wake error:`, err.message);
    // Non-fatal — heartbeat will catch it as fallback
  }
}

// Subscribe to INSERT and UPDATE on todos
const channel = supabase
  .channel("todos-watcher")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "todos" },
    async (payload) => {
      const row = payload.new;
      console.log(`[realtime] INSERT detected: "${row.title}"`);
      await autoAssign(row);
      if (isDispatchable(row)) {
        autoDispatch();
        wakeZiko(row);
      }
    }
  )
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "todos" },
    async (payload) => {
      const row = payload.new;
      const old = payload.old;
      // Auto-assign on update
      await autoAssign(row);
      // Only trigger if task just became todo+assigned (wasn't before)
      if (isDispatchable(row) && (old.status !== "todo" || old.assignee !== row.assignee || old.claimed_by)) {
        console.log(`[realtime] UPDATE detected — now dispatchable: "${row.title}"`);
        autoDispatch();
        wakeZiko(row);
      }
    }
  )

  .subscribe((status) => {
    console.log(`[realtime] Subscription status: ${status}`);
    if (status === "SUBSCRIBED") {
      console.log("[realtime] ✅ Listening for todo changes...");
    }
  });

// Keep alive + heartbeat log
setInterval(() => {
  console.log(`[realtime] Still listening... ${new Date().toISOString()}`);
}, 5 * 60 * 1000); // Log every 5 min

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[realtime] Shutting down...");
  supabase.removeChannel(channel);
  process.exit(0);
});

process.on("SIGTERM", () => {
  supabase.removeChannel(channel);
  process.exit(0);
});

console.log("[realtime] Task watcher started. Waiting for events...");
