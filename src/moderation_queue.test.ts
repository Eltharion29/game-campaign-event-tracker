import assert from "node:assert/strict";
import { shouldNotify, queueAsset } from "./moderation_queue.js";

const item = queueAsset({
  playerId: "player-7",
  playerEmail: "player@example.com",
  assetId: "asset-42",
  assetTitle: "Neon kart",
  assetUrl: "https://cdn.example.com/assets/42"
});

assert.equal(item.status, "queued");
assert.equal(shouldNotify([{ type: "delivered" }, { type: "open" }]), true);
assert.equal(shouldNotify([{ type: "delivered" }, { type: "bounce" }]), false);
console.log("moderation decision test passed");
