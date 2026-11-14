import { infrai } from "./infrai_email.js";
import { CampaignRequest, queueAsset } from "./moderation_queue.js";

export async function submitAsset(input: unknown) {
  const item = queueAsset(input);
  const result = await infrai.email.send({
    to: item.playerEmail,
    subject: `Asset review: ${item.assetTitle}`,
    html: `<p>Your asset <strong>${item.assetTitle}</strong> is queued for moderation.</p>`
  }, `asset-review:${item.assetId}`);
  return { item, messageId: result.message_id };
}

export async function readCampaignEvents(messageId: string) {
  return infrai.email.event.list(messageId);
}

export function campaignInput(input: CampaignRequest) {
  return queueAsset(input);
}
