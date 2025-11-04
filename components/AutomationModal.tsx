import React, { useState, useEffect } from 'react';
import type { Settings } from '../types';

interface AutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSettingChange: (key: keyof Settings, value: any) => void;
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative bg-dark-bg/80 p-3 rounded-lg border border-dark-border/50 text-xs font-mono">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md text-medium-text bg-dark-border hover:bg-dark-card transition-colors"
                aria-label="Copy code"
            >
                {copied ? <i className="fa-solid fa-check text-primary"></i> : <i className="fa-solid fa-copy"></i>}
            </button>
            <pre><code className={`language-${language}`}>{code}</code></pre>
        </div>
    );
};

const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, settings, onSettingChange }) => {
    const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl);
    const [enableWebhooks, setEnableWebhooks] = useState(settings.enableWebhooks);

    useEffect(() => {
        if (isOpen) {
            setWebhookUrl(settings.webhookUrl);
            setEnableWebhooks(settings.enableWebhooks);
        }
    }, [isOpen, settings.webhookUrl, settings.enableWebhooks]);

    const handleSave = () => {
        onSettingChange('webhookUrl', webhookUrl);
        onSettingChange('enableWebhooks', enableWebhooks);
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    const jsonExample = `{
  "symbol": "BTCUSDT.P",
  "timeframe": "1h",
  "type": "luxalgo-bullish-flip",
  "price": 68500.2,
  "body": "Bias flipped to Bullish at $68500.2000",
  "timestamp": 1672531200000
}`;

    const pythonExample = `from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    data = request.json
    print(f"Received alert: {data}")

    # --- Your trading logic here ---
    # Example:
    # symbol = data.get('symbol')
    # alert_type = data.get('type')
    # price = data.get('price')
    #
    # if alert_type == 'luxalgo-bullish-flip':
    #     print(f"Placing BUY order for {symbol} at {price}")
    #     # your_binance_client.place_buy_order(symbol, ...)
    # elif alert_type == 'luxalgo-bearish-flip':
    #     print(f"Placing SELL order for {symbol} at {price}")
    #     # your_binance_client.place_sell_order(symbol, ...)
    # -----------------------------

    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts
    app.run(port=5001, debug=True)
`;

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-dark-bg/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-3xl h-auto max-h-[90vh] flex flex-col border border-dark-border/50">
                <div className="flex justify-between items-center p-4 border-b border-dark-border">
                    <h2 className="text-xl font-bold text-light-text">Automation / Webhooks</h2>
                    <button onClick={onClose} className="text-2xl text-medium-text hover:text-light-text transition-colors" aria-label="Close automation settings">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="flex-grow p-4 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-light-text mb-2">Webhook Configuration</h3>
                        <p className="text-sm text-medium-text mb-4">
                            Send real-time alerts to a custom URL to automate your trading strategies. This is a more reliable alternative to screen-scraping bots.
                        </p>
                        <div className="p-4 rounded-lg bg-dark-card/80 space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="enable-webhooks-toggle" className="font-medium text-sm pr-4 text-light-text flex-grow cursor-pointer">
                                    Enable Webhooks
                                </label>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="enable-webhooks-toggle"
                                        className="sr-only peer"
                                        checked={enableWebhooks}
                                        onChange={(e) => setEnableWebhooks(e.target.checked)}
                                    />
                                    <div className="w-10 h-5 bg-dark-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-dark-card after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </div>
                             <div className={`transition-opacity duration-300 ${enableWebhooks ? 'opacity-100' : 'opacity-50'}`}>
                                <label htmlFor="webhook-url-input" className="block font-medium text-sm mb-1">
                                    Webhook URL
                                </label>
                                <input
                                    type="url"
                                    id="webhook-url-input"
                                    placeholder="https://your-server.com/webhook"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    disabled={!enableWebhooks}
                                    className="w-full h-10 rounded-lg bg-dark-bg/80 px-4 text-light-text outline-none border border-dark-border focus:ring-2 focus:ring-primary disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-light-text mb-2">Example Payload (JSON)</h3>
                            <CodeBlock code={jsonExample} language="json" />
                        </div>
                         <div>
                            <h3 className="text-lg font-semibold text-light-text mb-2">Receiver Example (Python)</h3>
                            <CodeBlock code={pythonExample} language="python" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-4 border-t border-dark-border">
                    <button onClick={handleSave} className="px-6 py-2 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AutomationModal;