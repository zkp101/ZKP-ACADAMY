# Partner Integration Guide (Example)
## Overview
Partners should call our `/partner_webhook` endpoint when a user completes a
8
qualifying action on their platform. We require a `partnerKey` (shared
secret) and the user's wallet address.
### Example POST body
```json
{
 "partnerKey": "SOME_SHARED_SECRET",
 "action": "complete",
 "wallet": "0xUserWalletAddress",
 "partnerReference": "order12345"
}
