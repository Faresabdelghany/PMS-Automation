const assert = require("node:assert/strict")

const { displayAgent, normalizeAgentSlug } = require("./activity-mirror-daemon")

assert.equal(normalizeAgentSlug("agent:tester:subagent:123"), "tester")
assert.equal(displayAgent("tester"), "Testing Agent")

console.log("activity-mirror-daemon checks passed")
