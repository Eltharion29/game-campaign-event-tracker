import { submitAsset, readCampaignEvents } from "../src/campaign_service.js";

const email = process.env.DEMO_PLAYER_EMAIL;
if (!email) throw new Error("DEMO_PLAYER_EMAIL is required");

const submitted = await submitAsset({
  playerId: "player-7",
  playerEmail: email,
  assetId: "asset-42",
  assetTitle: "Neon kart",
  assetUrl: "https://cdn.example.com/assets/42"
});
const events = await readCampaignEvents(submitted.messageId);
console.log({ status: submitted.item.status, messageId: submitted.messageId, events });
