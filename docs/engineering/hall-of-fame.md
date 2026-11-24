# Hall of Fame data and rewards

The Web and Student apps use the permanent `/leaderboard` route. Each ranking has its own query and keeps its three podium positions even when it has no standings. A completed room continues to show its own match results.

## Standings

- `GET /games/hall-of-fame/live?page=1&period=all-time` totals the finalized results for each TikTok username. Results come from comments received by the TikTok connector. Mock and externally submitted answers can still be used in unverified rooms. A match that accepted those answers is excluded from the official Live standings so it cannot distort the order of the speed awards. The historical TikTok table starts collecting data after deployment.
- `GET /games/hall-of-fame/battle?page=1&period=all-time` totals the existing saved Battle scores by account. Matches, wins and accuracy describe the settled records, which follow the existing top-20 settlement policy. New records are marked as Battle during settlement. Older records contributed only when they have a positive score, since the old schema also admitted zero-point Livestream host records and did not store the room type.
- Both standings APIs accept `weekly`, `monthly` and `all-time`. They return `{ page, pageSize, total, podium, items }`. The podium always represents the first three places in the selected period. All ranking points are read from settled results.

## Award grants and claims

`GET /games/hall-of-fame/awards` requires a valid JWT. It returns the user's reward grants plus the achievement catalog and the user's unlock dates from `Achievement` and `UserAchievement`. Award history is drawn from the grants with a recorded claim time.

A trusted operator or campaign job issues a `HallOfFameReward` row for an eligible account. The writer provides a stable `awardKey` (unique per user), `category`, `title`, `eventName`, `description`, `details`, `conditions`, and optionally `availableAt` and `expiresAt`. A null or future availability time keeps a grant locked. An elapsed deadline makes an unclaimed grant expired. Campaign qualification, grant issuance and delivery of any physical or third-party reward are handled by the campaign owner or fulfillment integration.

`POST /games/hall-of-fame/awards/:id/claim` uses the account from the authenticated request. It requires no request body. A single conditional database write records `claimedAt` if the grant belongs to that account and the claim window is open. Repeated calls return the existing confirmation. Unavailable grants return 409 and missing grants return 404. A successful response records the claim and adds it to the reward history.

## Database rollout

Apply the additive `20261124000000_hall_of_fame` migration before releasing either API implementation. The two API workspaces carry the same schema and migration. Apply the migration once per shared database.
