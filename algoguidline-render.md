# Guideline: Deploying the Ay4nbolic Algo Alert Bot on Render

## Introduction

This guide addresses the "Status Code: 451" error you might see in GitHub Actions. This error means GitHub's servers are being blocked by the Binance API, preventing the bot from getting market data.

To fix this, we will use a free service called **Render.com** to run our **Ay4nbolic Algo Alert Bot**. Render's free servers don't save files, so we'll also use **JSONBin.io** to act as the bot's memory. This will remember when an alert has been sent and prevent duplicate notifications.

This guide will walk you through setting up a dedicated cron job for the specialized **Ay4nbolic Algo alerts**.

## Bot Logic & Strategy

This bot implements the **Ay4nbolic Algo v6 (Threshold Edition)**, a channel-based trading algorithm. It identifies potential buy and sell opportunities by analyzing price action relative to a dynamically calculated high/low channel.

The core logic is as follows:
1.  **Channel Calculation:** It calculates the highest high and lowest low over a specific `Lookback Distance` (e.g., 30 candles) to form a trading channel.
2.  **Threshold-Based Entries:** A buy signal is considered when the price touches or goes below the lower channel boundary by a specific `Buy Threshold (%)`. This prevents entering trades too early.
3.  **Advanced Entry/Exit Conditions:** The bot doesn't just buy or sell based on the channel. It uses configurable candlestick patterns to confirm entries and exits, such as requiring a `Green Close` for buys or a `Doji` candle at a new high for sells.
4.  **Built-in Stop Loss:** It includes an optional, configurable stop loss that can be set based on the low of the signal candle, providing a basic risk management framework.

The bot is pre-configured with the settings you provided and scans the specified list of symbols on the 5m, 15m, 30m, and 1h timeframes.

### Enriched Alert Context

To make alerts more actionable, the bot sends a detailed Discord notification that includes:

*   **Signal Type:** Clearly states whether it's a BUY, SELL, or STOP LOSS Hit.
*   **Symbol & Timeframe:** Identifies the asset and the chart the signal occurred on.
*   **Price:** The price at the time of the signal candle's close.
*   **Trigger Condition:** Explains which specific entry/exit rule was met (e.g., `Green Close`, `Doji`).
*   **Stop Loss Level:** If a BUY signal is generated, the calculated stop loss price is included in the alert.
*   **Direct Chart Link:** A link to TradingView is provided to immediately analyze the chart context.

Here is an example of what an enriched alert looks like:

> **📈 BUY Signal: BTCUSDT (15m)**
> Ay4nbolic Algo triggered a **BUY** signal.
>
> **Price**
> `$68500.50`
>
> **Buy Condition**
> `Green Close`
>
> **Stop Loss Level**
> `$67980.25`
>
> **Chart**
> [View on TradingView](https://www.tradingview.com/chart/?symbol=BINANCE%3ABTCUSDT&interval=15)

### Advanced Spam Prevention: Event-Based IDs
To ensure you receive every important signal without getting spammed by duplicates, the bot uses a sophisticated **event-based ID system**.

The bot generates a unique ID for every single signal based on its **candle timestamp**. For example: `BTCUSDT-15m-BUY-1672531200000`. This ID is stored in the bot's memory (JSONBin).

This means the bot will only fire an alert for a specific event *once*, but it remains ready to immediately alert you to a new, different event (like a SELL or SL Hit) on the very next candle. This provides maximum signal accuracy without the risk of missing a crucial market move.

---

## Step 1: Create a Free JSONBin.io Account to Store Alert History

This service will act as a private online storage for your bot's memory. It is highly recommended to use a **separate bin** for this bot to keep its memory distinct from the Trailing Stop bot.

1.  Go to [jsonbin.io](https://jsonbin.io) and sign in.
2.  On your dashboard, click the **"+ Add New Bin"** button in the top right.
3.  Delete the placeholder text and type a single, empty JSON object: `{}`
4.  Click the blue **"Save Bin"** button.
5.  **Copy the Bin ID:** After saving, look at the URL in your browser's address bar. It will look like this:
    `https://jsonbin.io/b/667c2a7de41b4d34e40f3a3e`
    The long string of letters and numbers after `/b/` is your **new Bin ID**. Copy it and save it.
6.  **Get your API Key:** If you don't have it saved, click on your account icon in the top right, then **"API Keys"**, and copy your **Master Key**.

---

## Step 2: Ensure Your Discord Webhook is Ready

For organizational purposes, it's a good idea to create a new, dedicated webhook for this algorithm's alerts in your Discord server. Save the **Webhook URL**.

---

## Step 3: Create and Configure Your Render Cron Job

1.  Go to [render.com](https://render.com) and sign in to your Dashboard.
2.  Click **"New +"** -> **"Cron Job"**.
3.  Connect your `crypto-alerts` repository if you haven't already.

4.  Fill out the settings for the Cron Job:
    *   **Name:** `crypto-bot-ayanbolic-algo`
    *   **Region:** Choose a region in Europe, such as **Frankfurt (EU Central)**. This is key to avoid the Binance block.
    *   **Branch:** `main`
    *   **Build Command:** (leave this blank or use `npm install` if you add dependencies later)
    *   **Start Command:** `node algo_alerts.js`
    *   **Schedule:** Enter `*/5 * * * *` (This means "run every 5 minutes," which is suitable for the lowest timeframe being scanned).
5.  Click **"Create Cron Job"**. The initial deployment will start.

---

## Step 4: Add Your Secrets to Render

1.  In your new `crypto-bot-ayanbolic-algo` service on Render, click the **"Environment"** tab.
2.  Scroll to **"Environment Variables"** and click **"Add Environment Variable"**.
3.  Add the secrets for this specific bot. It's recommended to use the `_ALGO` suffix to avoid confusion with your other bot.
    *   **Key:** `DISCORD_WEBHOOK_URL_ALGO`, **Value:** (Paste your new Discord Webhook URL)
    *   **Key:** `JSONBIN_API_KEY`, **Value:** (Paste your JSONBin Master Key)
    *   **Key:** `JSONBIN_BIN_ID_ALGO`, **Value:** (Paste your new JSONBin Bin ID for this bot)
4.  Click **"Save Changes"**. Render will automatically start a new deployment with these secrets.

---

## Step 5: Test and Verify

1.  Wait for the new deployment to finish (it should show a "Live" status).
2.  Go to the Cron Job's page and click the **"Trigger Run"** button to test it manually.
3.  Click the **"Logs"** tab. You should see it start up and begin processing the symbols and timeframes you configured in `algo_alerts.js`. If it finds a new signal, a detailed message will appear in your Discord channel.
4.  You can also check your new JSONBin.io bin to see if it now contains data, confirming its memory is working.

**Congratulations!** Your specialized Ay4nbolic Algo Alert Bot is now running reliably 24/7 on Render's cloud.