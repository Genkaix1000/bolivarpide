/**
 * Runnable check for like session id shape.
 * Run: npx tsx src/lib/likes/session.check.ts
 */
import assert from "node:assert/strict";

const SESSION_RE = /^[a-zA-Z0-9_-]{8,64}$/;

assert.equal(SESSION_RE.test("abcdefgh"), true);
assert.equal(SESSION_RE.test("short"), false);
assert.equal(SESSION_RE.test("a".repeat(65)), false);
assert.equal(SESSION_RE.test("ok_session-123"), true);

console.log("likes/session.check.ts: ok");
