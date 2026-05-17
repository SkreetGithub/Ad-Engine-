# How to Get Your Meta Ad Account ID (and fix error #100)

If you see:

**"Meta API error: (#100) The global id XXXXX is not allowed for this call. Ensure META_AD_ACCOUNT_ID is your ad account ID in Ads Manager (format act_123456789), not your Page ID."**

the app is using the wrong ID. The number in the error is often your **Facebook Page ID**. Meta’s ad APIs need your **Ad Account ID** instead.

---

## 1. Ad Account ID ≠ Page ID

| Variable             | What it is                         | Where you use it        |
|----------------------|------------------------------------|-------------------------|
| **META_AD_ACCOUNT_ID** | The ad account (where you run ads) | `.env.local`            |
| **META_PAGE_ID**       | The Facebook Page (profile/business page) | `.env.local` (separate) |

They are different numbers. Use the **ad account** value for `META_AD_ACCOUNT_ID`.

---

## 2. How to get your Ad Account ID

### Option A: From Ads Manager (easiest)

1. Go to [Facebook Ads Manager](https://business.facebook.com/adsmanager).
2. Open the **account dropdown** (top left, often shows “Personal account” or your account name).
3. In the list of ad accounts, your **Ad account ID** is the number under the account name (e.g. **1444451517342319**).
4. In `.env.local` set:
   - `META_AD_ACCOUNT_ID=1444451517342319`  
   or  
   - `META_AD_ACCOUNT_ID=act_1444451517342319`  
   (the app adds the `act_` prefix if you omit it.)

### Option B: From the Ads Manager URL

1. In Ads Manager, switch to the correct ad account.
2. Look at the browser URL. You’ll see something like:
   - `...act=123456789012345&...`
3. The number after `act=` is your ad account ID (e.g. `123456789012345`).
4. In `.env.local`:
   - `META_AD_ACCOUNT_ID=123456789012345`  
   or  
   - `META_AD_ACCOUNT_ID=act_123456789012345`

### Option C: From Meta Business Settings

1. Go to [Meta Business Suite](https://business.facebook.com) → **Settings** (gear icon).
2. In the left menu: **Accounts** → **Ad accounts**.
3. Click the ad account you use for this app.
4. The **Ad account ID** is shown (numeric, often 15–16 digits).
5. Put that in `.env.local` as above (with or without `act_`).

---

## 3. Set both IDs in `.env.local`

```bash
# Ad account (from Ads Manager / Business Settings) — required for creating campaigns
META_AD_ACCOUNT_ID=act_1444451517342319

# Page (your Facebook Page) — required for the “Page” the ad promotes
META_PAGE_ID=61588496181643
```

Use **your** ad account ID and page ID, not the examples. Restart the dev server after changing `.env.local`.

---

## 4. When the number in the error is your Page ID (e.g. 61588496181643)

If you already set `META_AD_ACCOUNT_ID` to your ad account (e.g. `act_1444451517342319`) and the error still shows a number like `61588496181643`, that number is usually your **Page ID**. Meta is then rejecting it in the **ad set** call (where we send “which Page this ad is for”).

- Make sure the **Page** in `META_PAGE_ID` is the one you actually use with this ad account (same Business / same person).
- In [Business Settings](https://business.facebook.com/settings) → **Accounts** → **Ad accounts** → your ad account → **People** / **Pages**: confirm your Page is linked and has the right role.
- The access token must have **ads_management** and **pages_read_engagement** (or **pages_manage_ads**) and be generated for the same user/Business that owns the ad account and the Page.

## 5. "Ads creative was created by an app that is in development mode"

To **create and run live ads**, your Meta/Facebook app must be in **Live** mode, not Development.

**Current flow (Use Case apps):**

1. Go to [Meta for Developers](https://developers.facebook.com/apps) and open your app.
2. In the left sidebar, go to **Publish**.
3. Complete any required items (e.g. **Privacy policy URL**, use cases like **Create & manage ads with Marketing API**).
4. Open **Publish > Go live** (or the **Go live** section on the Publish page).
5. Click the **Go live** button (Meta shows it in the **bottom right** of that screen).
6. After the app is Live, try creating the ad again.

If your app uses the older layout, the control may be an **App mode** toggle in the top bar (Development ↔ Live). [App modes](https://developers.facebook.com/docs/development/build-and-test/app-modes) · [Publish / Release](https://developers.facebook.com/docs/development/release)

---

## 6. If the error still persists

- Confirm the token in `META_ACCESS_TOKEN` has **Ads Management** and **Page** permissions and is for the same Business/Page that owns the ad account.
- In Meta’s [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/), paste your token and check that the listed permissions include ads and pages.
