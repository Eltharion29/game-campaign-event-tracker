import { z } from "zod";

export const campaignRequest = z.object({
  playerId: z.string().min(1),
  playerEmail: z.string().email(),
  assetId: z.string().min(1),
  assetTitle: z.string().min(1),
  assetUrl: z.string().url()
});

export type CampaignRequest = z.infer<typeof campaignRequest>;
export type ModerationItem = CampaignRequest & { status: "queued" | "approved" | "rejected" };

export function queueAsset(input: unknown): ModerationItem {
  const request = campaignRequest.parse(input);
  return { ...request, status: "queued" };
}

export function shouldNotify(events: Array<{ type?: string; event?: string }>): boolean {
  return events.some((event) => (event.type ?? event.event) === "open");
}
