# Meta API: is_adset_budget_sharing_enabled (Single Module)

## The error

```
Must specify True or False in is_adset_budget_sharing_enabled field: You must specify True or False in the field is_adset_budget_sharing_enabled if you are not using campaign budget.
```

- **When:** Creating an ad set via `POST /act_{ad_account_id}/adsets` (Meta Marketing API).
- **Why:** We set budget at the **ad set** level (`lifetime_budget` or `daily_budget`), not at the campaign level. Meta requires `is_adset_budget_sharing_enabled` whenever you are not using campaign budget.

## Where the fix lives (single place)

**File:** `lib/meta-ad-api.ts`

All Facebook/Meta ad AI logic is in this one file:

- **determineBudgetSharing({ useCampaignBudget, isScaling }):** If **campaign budget (CBO)** → return **null** (omit field). If **ad set budget** → return **isScaling ? "True" : "False"** (micro-test → False, scaling → True).
- **buildAdSetFormBody(..., budgetSharing):** When not null, field is set **first** in the form body (Meta requirement).
- **createAdSet(opts):** Accepts `useCampaignBudget?: boolean`, `isScaling?: boolean`. Default is micro-test (False).
- **Creation:** `createCampaign()`, `createAdSet()`, `createCreative()`, `createCreativeFromPost()`, `createAd()` — all use the correct ad set body.
- **Errors:** `formatMetaError()`, `formatMetaErrorResponse()`.

**Rules:** When using **campaign budget**, omit the field. When using **ad set budget**, send **True** (scaling) or **False** (micro-test).

## Call sites (all use meta-ad-api)

| Route | Uses |
|-------|------|
| `app/api/campaigns/quick-launch/route.ts` | `createCampaign`, `createAdSet`, `createCreative`, `createAd`, `formatMetaErrorResponse` |
| `app/api/facebook/campaign/route.ts` | same |
| `app/api/automation/rotate/route.ts` | same |
| `app/api/facebook/boost/route.ts` | same + `createCreativeFromPost` |

Any fix for the budget-sharing error should be made **only** in `lib/meta-ad-api.ts`.

## Meta API reference

- [Ad Set Budget Sharing](https://developers.facebook.com/docs/marketing-api/bidding/guides/adset-budget-sharing/)
- [Create an Ad Set](https://developers.facebook.com/docs/marketing-api/get-started/basic-ad-creation/create-an-ad-set/)

Request body is `application/x-www-form-urlencoded`. Graph API base: `https://graph.facebook.com/v21.0`.
