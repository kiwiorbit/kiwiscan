import type { Notification } from '../types';

interface NotificationDetails {
    icon: string;
    title: string;
    body: string;
    accentColor: string;
    iconColor: string;
}

export const getNotificationDetails = (notification: Notification): NotificationDetails => {
    let icon = 'fa-bell', title = 'Notification', body = '...', accentColor = 'bg-gray-500', iconColor = 'text-gray-500';

    switch (notification.type) {
        case 'accumulation-volume':
            icon = 'fa-box-archive';
            title = `${notification.symbol}`;
            body = notification.body || 'Accumulation Vol Detected';
            accentColor = 'bg-indigo-500';
            iconColor = 'text-indigo-500';
            break;
        case 'luxalgo-bullish-flip':
            icon = 'fa-retweet';
            title = `${notification.symbol} Kiwi trail Buys (${notification.timeframe})`;
            body = notification.body || `Bias flipped bullish.`;
            accentColor = 'bg-green-500';
            iconColor = 'text-green-500';
            break;
        case 'luxalgo-bearish-flip':
            icon = 'fa-retweet';
            title = `${notification.symbol} Kiwi trail Sells (${notification.timeframe})`;
            body = notification.body || `Bias flipped bearish.`;
            accentColor = 'bg-red-500';
            iconColor = 'text-red-500';
            break;
        case 'supertrend-buy':
            icon = 'fa-arrow-trend-up';
            title = `Supertrend Buy Signal`;
            body = `${notification.symbol} (${notification.timeframe}) trend flipped to Bullish.`;
            accentColor = 'bg-green-500';
            iconColor = 'text-green-500';
            break;
        case 'supertrend-sell':
            icon = 'fa-arrow-trend-down';
            title = `Supertrend Sell Signal`;
            body = `${notification.symbol} (${notification.timeframe}) trend flipped to Bearish.`;
            accentColor = 'bg-red-500';
            iconColor = 'text-red-500';
            break;
    }

    return { icon, title, body, accentColor, iconColor };
};
