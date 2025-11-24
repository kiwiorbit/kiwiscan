# Guideline: Deploying the Trailing Stop Alert Bot on Render

## Introduction

This guide addresses the "Status Code: 451" error you might see in GitHub Actions. This error means GitHub's servers are being blocked by the Binance API, preventing the bot from getting market data.

To fix this, we will use a free service called **Render.com** to run our **Trailing Stop Alert Bot**. Render's free servers don't save files, so we'll also use **JSONBin.io** to act as the bot's memory. This will remember when a trailing stop flip alert has been sent and prevent duplicate notifications.

This guide will walk you through setting up a dedicated cron job for the specialized **Trailing Stop alerts**.

## Bot Logic & Strategy

It's important to understand that this bot does not scan every single crypto asset on every timeframe. This would be inefficient and generate a lot of low-quality noise.

Instead, the bot employs a **targeted scanning strategy**. It uses a curated list of symbols that have been pre-selected based on historical performance with this specific alert strategy. These symbols are divided into three groups:

1.  **Common Symbols:** A core group of assets that are checked on both the **1-hour and 4-hour** timeframes.
2.  **1-Hour Only:** A specific list of assets that are only checked on the **1-hour** timeframe.
3.  **4-Hour Only:** Another specific list of assets that are only checked on the **4-hour** timeframe.

This data-driven approach ensures the bot focuses its resources on the highest-probability setups. By using optional **Heikin Ashi smoothing**, it further reduces market noise to increase the signal-to-noise ratio of the alerts you receive.

### Conditional 15-Minute Scanning (VWAP Filter)

In addition to the fixed 1-hour and 4-hour checks, the bot performs a special, high-frequency scan on a broad list of assets using the **15-minute timeframe**.

However, to maintain a high signal quality and focus only on assets showing strong intraday momentum, these 15-minute checks are **conditional**. An alert for a symbol on this list will only be processed if its current price is trading **above the daily VWAP (Volume-Weighted Average Price)**. This acts as a powerful trend filter, ensuring that you are only alerted to low-timeframe bullish setups when the asset is already in a position of strength for the day.

### Enriched Alert Context

To make alerts more actionable, the bot enriches each notification with crucial data points, giving you a comprehensive snapshot of the market context at the moment of the signal.

*   **Daily VWAP (Volume-Weighted Average Price):** This shows whether the flip occurred above or below the daily VWAP. A flip above the VWAP is generally considered stronger and indicates the asset is trading in a bullish context for the day.
*   **RSI (4h):** The Relative Strength Index on the 4-hour timeframe provides insight into the asset's momentum. It helps you determine if a bullish flip is happening from an oversold condition (potentially more upside) or if the asset is already overbought.
*   **vs BTC (1h):** This metric shows the asset's performance relative to Bitcoin over the last hour. A positive percentage means the asset is outperforming Bitcoin, indicating it has strong relative strength in the current market.

Here is an example of what an enriched alert looks like:

> **SOLUSDT**
> Kiwitrail Bot Buys on (1h)
> Bias flipped to Bullish
> Price : $145.8200
>
> [View Chart](https://www.tradingview.com/chart/?symbol=BINANCE%3ASOLUSDT&interval=60)
>
> **Net vol :**
> `(15m) : +$1.2M`
> `(1h)  : +$3.5M`
> `(4h)  : -$500.1K`
>
> **Oi % :**
> `(1h) : +1.50%`
> `(4h) : +4.75%`
> `(8h) : +8.20%`
>
> **Daily VWAP**
> `$142.5000`
> **🔼 Above**
>
> **RSI (4h)**
> `55.30`
>
> **vs BTC (1h)**
> `+0.85%`

### Advanced Spam Prevention: Event-Based IDs
To ensure you receive every important signal without getting spammed by duplicates, the bot has been upgraded from a simple time-based cooldown to a sophisticated **event-based ID system**.

*   **Old Method (Problematic):** The bot used to have a 3-hour cooldown for any given symbol/timeframe pair. If `SOLUSDT (1h)` flipped bullish, it couldn't fire *any* other `SOLUSDT (1h)` alert (like a subsequent bearish flip) for 3 hours. This could cause you to miss important, legitimate signals.

*   **New Method (Robust):** The bot now generates a unique ID for every single flip event based on its **candle timestamp**. For example: `SOLUSDT-1h-luxalgo-bullish-flip-1672531200000`. This ID is stored in the bot's memory (JSONBin).

This means the bot will only fire an alert for a specific event *once*, but it remains ready to immediately alert you to a new, different event on the very next candle. This provides maximum signal accuracy without the risk of missing a crucial market move due to an arbitrary cooldown.

---

## Step 1: Create a Free JSONBin.io Account to Store Alert History

This service will act as a private online storage for your bot's memory. If you are also running the Basic Indicator Alert Bot, you can use the same account and bin for both.

1.  Go to [jsonbin.io](https://jsonbin.io) and sign up for a free account.
2.  On your dashboard, click the **"+ Add New Bin"** button in the top right.
3.  You will be taken to an editor page. JSONBin requires some initial content to create the bin. Delete all the placeholder text and type a single, empty JSON object:
    ```json
    {}
    ```
4.  Click the blue **"Save Bin"** button. This will create the bin.
5.  **Copy the Bin ID:** After saving, look at the URL in your browser's address bar. It will look something like this:
    `https://jsonbin.io/b/667c2a7de41b4d34e40f3a3e`
    The long string of letters and numbers after `/b/` is your **Bin ID**. Copy it and save it in a temporary text file.
6.  **Get your API Key:** In the top right corner of the JSONBin website, click on your account icon/name, then click **"API Keys"**.
7.  You will see a **Master Key** already created for you. Click the "Copy" icon next to it. Save this in your text file as well. **This key is a secret!**

You should now have your Bin ID and Master Key saved.

---

## Step 2: Ensure Your Discord Webhook is Ready

Make sure you have your **Discord Webhook URL** saved. If not, you will need to create a new one in your Discord server settings.

---

## Step 3: Create and Configure Your Render Cron Job

1.  Go to [render.com](https://render.com) and sign up for a free account (signing up with GitHub is easiest).
2.  On the Render Dashboard, click the **"New +"** button and then select **"Cron Job"**.
3.  **Connect your repository:** Find your `crypto-alerts` repository in the list and click the **"Connect"** button next to it.

4.  Fill out the settings for the Cron Job:
    *   **Name:** `crypto-bot-trailing-stop`
    *   **Region:** Choose a region in Europe, such as **Frankfurt (EU Central)**. This is the key step to avoid the block.
    *   **Branch:** `main`
    *   **Build Command:** `npm install`
    *   **Start Command:** `npm run start:trailing-stop`
    *   **Schedule:** Enter `*/15 * * * *` (This means "run every 15 minutes").
5.  Click **"Create Cron Job"**. The initial deployment will start and likely fail, which is normal.

---

## Step 4: Add Your Secrets to Render

1.  In your `crypto-bot-trailing-stop` service on Render, click the **"Environment"** tab.
2.  Scroll down to **"Environment Variables"** and click **"Add Environment Variable"** to create rows for the secrets.
3.  Add the secrets required for this specific bot:
    *   **Key:** `DISCORD_WEBHOOK_URL`, **Value:** (Paste your Discord Webhook URL)
    *   **Key:** `JSONBIN_API_KEY`, **Value:** (Paste your JSONBin Master Key)
    *   **Key:** `JSONBIN_BIN_ID`, **Value:** (Paste your JSONBin Bin ID)
    *   **Key:** `ALERT_LUXALGO_FLIP_ENABLED`, **Value:** `true`
    *   **Key:** `USE_HEIKIN_ASHI`, **Value:** `true`
4.  Click **"Save Changes"**. Render will automatically start a new deployment.

> **Note on `USE_HEIKIN_ASHI`:** This new setting enables Heikin Ashi candle smoothing before the trailing stop is calculated. This technique helps to reduce market noise and can lead to more reliable trend signals. Setting it to `true` is recommended as it aligns the bot's logic with the default, noise-reducing view in the main web application.

---

## Step 5: Test and Verify

1.  Wait for the deployment to finish (it should show a "Live" status).
2.  Go to the Cron Job's page and click the **"Trigger Run"** button to test it manually.
3.  Click the **"Logs"** tab. You should see it start up and process symbols without any `451` errors. If it finds an alert, a message will appear in your Discord channel.
4.  You can also check your JSONBin.io bin to see if it now contains data with timestamps, confirming its memory is working.

---

## Step 6: Disable the Old GitHub Action (If Applicable)

If you were previously using a GitHub Action that is now failing, you should disable it.
1.  Go to your GitHub repository and click the **"Actions"** tab.
2.  On the left, click on the workflow (e.g., "Crypto Alert Checker").
3.  Click the **"..."** menu button and select **"Disable workflow"**.

**Congratulations!** Your specialized Trailing Stop Alert Bot is now running reliably 24/7 on Render's cloud.