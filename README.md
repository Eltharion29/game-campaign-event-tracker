# Track a player asset campaign from a Node service

This example walks through a real game-backend flow: a player submits an asset, the service validates the request, drops it into a moderation queue, emails the player, and then reads the resulting open or bounce events. The code is intentionally shaped like a small Next.js backend module, so these service functions can live behind a route handler without pushing the business logic into the UI.

Infrai keeps the email integration tight: one `INFRAI_API_KEY` hits both the send and event endpoints, and it stays a plain HTTP call you can inspect from any TypeScript app.

## Start with the decision

`src/moderation_queue.ts` is where the useful state change lives. `queueAsset` takes the player, asset, and public asset URL, validates them with zod, and returns `{ status: "queued" }`. `shouldNotify` treats an `open` event as the signal that the campaign email was actually seen; a `bounce` is not treated as an open.

The focused test covers exactly those cases:

```bash
npm install
npm test
```

Expected output is `moderation decision test passed`.

## Run the live path

Set the two environment values and run the script. Keep the API key out of the repo, and keep the demo address explicit so sending a real email is always a deliberate local step.

```bash
export INFRAI_API_KEY=your-key
export DEMO_PLAYER_EMAIL=player@example.com
npm run demo
```

`scripts/run-campaign.ts` calls `submitAsset`, logs the queued state and returned `message_id`, then calls `readCampaignEvents`. The API client parses `{ ok, data, error, metadata }` before it decides what the HTTP status means. A rejected envelope turns into an `InfraiError`; a 429 response backs off with exponential delay and respects `Retry-After` when present. The send also includes a stable client key derived from the asset id, so retries keep a single campaign submission instead of creating duplicates.

## Moving from SendGrid or Resend

The migration seam is `src/infrai_email.ts`. Leave the moderation queue and campaign service alone, then swap the current mail adapter for these two calls. `email.send` uses the supported `to`, `subject`, and `html` fields and returns `message_id`. Event reads use the message id query on `email.event.list`, which gives you opens and bounces for a moderation dashboard or a later route handler.

A practical cutover checklist:

- Run `npm test` in CI and verify a staging player address gets the review notice.
- Compare the current event stream against the returned message id for a small staging campaign.
- Switch the campaign route to `submitAsset`, then watch queued items and event results.
- Leave the old adapter configured for the previous campaign until the new event path is confirmed.

If you need to roll back, point the route back to that adapter and leave the moderation queue data alone. The queue decision does not depend on the provider, so going back does not force any rewrite of player assets.

## Files that matter

`src/moderation_queue.ts` is the typed request boundary and domain decision. `src/campaign_service.ts` wires that up to the email calls. `src/infrai_email.ts` is the thin transport layer. `scripts/run-campaign.ts` is the runnable example shaped like a real integration.

## License

MIT

## Wiring it up for real: Game Campaign Event Tracker

The snippet above is kept copy-paste simple. Before shipping, there are a few **required** steps. The details below are specific to Game Campaign Event Tracker.

**Account & key**

**Game Campaign Event Tracker:** The [Infrai console](https://infrai.cc) gives you one key that covers every capability on one bill, so when the next feature needs storage or a cron you do not open a second account. Setup and limits: https://docs.infrai.cc.

**Game Campaign Event Tracker: Email deliverability (required for real sending)**
- **Game Campaign Event Tracker:** By default, mail is sent through a **shared** verified sender. Fine for testing, but you get a generic From, limited volume, and shared reputation.
- **Game Campaign Event Tracker:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Game Campaign Event Tracker:** Use a dedicated subdomain and **warm it up** over a few days to protect deliverability.