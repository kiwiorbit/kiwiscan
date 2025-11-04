import React, { useState, useEffect, useRef } from 'react';
import Starfield from './Starfield';
import Footer from './Footer';

// Make solanaWeb3 globally available from the script tag in index.html
declare const solanaWeb3: any;
declare global {
    interface Window {
        ethereum?: any;
        phantom?: any;
        Jupiter?: any;
    }
}

interface GatewayPageProps {
    onConnect: (address: string) => void;
    onSubscribe: () => void;
    userAddress: string | null;
}

// Set payment to false to enable developer mode
const IS_PAYMENT_ENABLED = false;
const RECIPIENT_WALLET_ADDRESS = 'DU3RjSbkgEY7GkiTEMhZXUXcUuHR3sNgYAwCWCCkMrLa';
const SOLANA_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=3edbc879-730f-4a7c-a258-1da97aa4d8e2';

const features = [
    { icon: 'fa-chart-line', title: 'Multi-Timeframe Analysis', description: 'View Kiwi Trail signals across multiple timeframes, from 1 minute to 4 hours, to catch moves early.', imageUrl: '' },
    { icon: 'fa-shoe-prints', title: 'Advanced Technicals', description: 'Utilize our proprietary Kiwi Trail with Heikin Ashi smoothing and the classic Supertrend indicator to confirm trends.', imageUrl: '' },
    { icon: 'fa-ruler-combined', title: 'Key Level Analysis', description: 'Identify critical support/resistance with automatic Golden Pocket (Fibonacci) levels and a high-resolution Volume Profile.', imageUrl: '' },
    { icon: 'fa-expand', title: 'Dual Chart Modes', description: 'Analyze assets in a quick-view line chart modal or dive deep with a full-screen candlestick page for detailed study.', imageUrl: '' },
    { icon: 'fa-exchange-alt', title: 'Multi-Exchange Scanners', description: 'Switch between dedicated scanners for Binance (CEX) and top MEXC gainers to find diverse opportunities.', imageUrl: '' },
    { icon: 'fa-fire', title: 'Confluence Filters', description: 'Isolate high-probability setups by filtering for symbols with confluent bullish signals across multiple indicators.', imageUrl: '' },
    { icon: 'fa-bell', title: 'Real-Time Alerts', description: 'Configure and receive instant notifications for critical market events like bias flips and supertrend changes.', imageUrl: '' },
    { icon: 'fa-robot', title: 'Automation via Webhooks', description: 'Connect your trading bots directly to scanner alerts for automated strategy execution.', imageUrl: '' },
    { icon: 'fa-cogs', title: 'Deep Customization', description: 'Tailor the scanner to your needs by creating custom asset lists, adjusting indicator settings, and managing table columns.', imageUrl: '' },
];


// Custom hook for observing elements
const useIntersectionObserver = (options: IntersectionObserverInit & { triggerOnce?: boolean }) => {
    const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
    const observer = useRef<IntersectionObserver | null>(null);
    const { threshold, root, rootMargin, triggerOnce } = options;

    useEffect(() => {
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((observerEntries, currentObserver) => {
            setEntries(observerEntries);
            if (triggerOnce) {
                observerEntries.forEach(entry => {
                    if (entry.isIntersecting) {
                        currentObserver.unobserve(entry.target);
                    }
                });
            }
        }, { threshold, root, rootMargin });

        const { current: currentObserver } = observer;
        return () => {
            if (currentObserver) {
                currentObserver.disconnect();
            }
        };
    }, [threshold, root, rootMargin, triggerOnce]);

    return [observer, entries] as const;
};

const AnimatedSection: React.FC<{ children: React.ReactNode, className?: string, id?: string }> = ({ children, className, id }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [observer, entries] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });

    useEffect(() => {
        const currentRef = ref.current;
        const currentObserver = observer.current;
        if (currentRef && currentObserver) {
            currentObserver.observe(currentRef);
        }
        return () => {
            if (currentRef && currentObserver) {
                currentObserver.unobserve(currentRef);
            }
        };
    }, [ref, observer]);

    const isVisible = entries.some(entry => entry.target === ref.current && entry.isIntersecting);

    return (
        <div
            ref={ref}
            id={id}
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
        >
            {children}
        </div>
    );
};


type WalletType = 'metamask' | 'phantom' | 'brave' | 'jupiter' | 'default';

const WALLET_INFO: { [key in WalletType]: { name: string } } = {
    metamask: { name: 'MetaMask' },
    phantom: { name: 'Phantom' },
    brave: { name: 'Brave Wallet' },
    jupiter: { name: 'Jupiter' },
    default: { name: 'Browser Wallet' },
};

const WalletIcon: React.FC<{ walletType: WalletType }> = ({ walletType }) => {
    const iconSize = 24;
    switch (walletType) {
        case 'metamask':
            return <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" width={iconSize} height={iconSize} />;
        case 'phantom':
            return <img src="https://seeklogo.com/images/P/phantom-logo-C5684A1896-seeklogo.com.png" alt="Phantom" width={iconSize} height={iconSize} />;
        case 'brave':
            return <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Brave_logo_lion_color.svg" alt="Brave" width={iconSize} height={iconSize} />;
        case 'jupiter':
            return <img src="https://jup.ag/svg/jupiter-logo.svg" alt="Jupiter" width={iconSize} height={iconSize} />;
        default:
            return <i className="fa-solid fa-wallet text-xl text-primary/80"></i>;
    }
};

const GatewayPage: React.FC<GatewayPageProps> = ({ onConnect, onSubscribe, userAddress }) => {
    const [isConnecting, setIsConnecting] = useState<WalletType | null>(null);
    const [connectError, setConnectError] = useState('');
    const [subscribeStatus, setSubscribeStatus] = useState('');
    const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
    const [showWalletList, setShowWalletList] = useState(false);

    useEffect(() => {
        const detectWallets = () => {
            const wallets: WalletType[] = [];
            if (window.ethereum) {
                if (window.ethereum.providers?.some((p: any) => p.isMetaMask)) wallets.push('metamask');
                else if (window.ethereum.isMetaMask) wallets.push('metamask');
                if (window.ethereum.isBraveWallet) wallets.push('brave');
            }
            if (window.phantom?.ethereum) wallets.push('phantom');
            if (window.Jupiter) wallets.push('jupiter');
            if (window.ethereum && !wallets.includes('metamask') && !wallets.includes('brave') && !wallets.includes('phantom')) wallets.push('default');
            setDetectedWallets([...new Set(wallets)]);
        };
        
        const timeout = setTimeout(detectWallets, 500);
        window.addEventListener('load', detectWallets);
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('load', detectWallets);
        };
    }, []);
    
    useEffect(() => {
        if (!IS_PAYMENT_ENABLED && userAddress) {
            setSubscribeStatus('Developer Mode: Granting Access...');
            const timer = setTimeout(() => { onSubscribe(); }, 1000);
            return () => clearTimeout(timer);
        }
    }, [userAddress, onSubscribe]);

    const handleConnectWallet = async (walletType: WalletType) => {
        setIsConnecting(walletType);
        setConnectError('');
        let provider;
        try {
            if (walletType === 'jupiter') {
                provider = window.Jupiter;
                if (!provider) throw new Error('Jupiter Wallet not found.');
                const response = await provider.connect();
                const publicKey = response.publicKey.toString();
                if (publicKey) onConnect(publicKey);
                else setConnectError('No accounts found. Please unlock your wallet.');
            } else { // EVM wallets
                if (walletType === 'metamask') {
                    provider = window.ethereum?.providers?.find((p: any) => p.isMetaMask) || window.ethereum;
                    if (!provider || !provider.isMetaMask) throw new Error('MetaMask not found. Please use the MetaMask app browser or install the extension.');
                } else if (walletType === 'phantom') {
                    provider = window.phantom?.ethereum;
                    if (!provider) throw new Error('Phantom not found. Please use the Phantom app browser or install the extension.');
                } else if (walletType === 'brave') {
                    provider = window.ethereum;
                    if (!provider || !provider.isBraveWallet) throw new Error('Brave Wallet not found. This option is for the native Brave browser wallet.');
                } else {
                    provider = window.ethereum;
                    if (!provider) throw new Error('No EVM wallet found. Please install a wallet extension.');
                }
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                if (accounts.length > 0) onConnect(accounts[0]);
                else setConnectError('No accounts found. Please unlock your wallet.');
            }
        } catch (err: any) {
            if (err.code === 4001) setConnectError('Connection request was rejected by the wallet.');
            else setConnectError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsConnecting(null);
        }
    };
    
    return (
        <div className="w-full min-h-screen text-light-text relative overflow-x-hidden bg-dark-bg">
            <Starfield />
            <div className="aurora-container">
                <div className="aurora-shape aurora-shape1"></div>
                <div className="aurora-shape aurora-shape2"></div>
                <div className="aurora-shape aurora-shape3"></div>
            </div>
            
            <header className="absolute top-0 left-0 right-0 z-50 p-4">
                 <div className="container mx-auto flex justify-center md:justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                         <svg className="w-8 h-8" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M56 184L93.3333 136L128 156L165.333 92L200 116" stroke="#29ffb8" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         <span className="font-bold text-lg">Crysi Scanner</span>
                    </div>
                     <nav className="hidden md:flex items-center gap-6">
                         <button
                            onClick={() => document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' })}
                            disabled={!!isConnecting || !!userAddress}
                            className="text-sm font-semibold text-dark-bg bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isConnecting 
                                ? <i className="fa-solid fa-spinner fa-spin"></i> 
                                : userAddress 
                                    ? 'Connected' 
                                    : 'Connect Wallet'
                            }
                        </button>
                     </nav>
                 </div>
            </header>
            
            <main className="relative z-10">
                <section className="min-h-screen flex items-center justify-center text-center px-4 pt-24">
                    <div className="max-w-3xl animate-slide-down-fade-in">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
                            Navigate the Crypto Markets <span className="text-primary">with Precision</span>
                        </h1>
                        <p className="mt-6 text-lg text-medium-text max-w-2xl mx-auto">
                            Crysi Scanner is an advanced market analysis dashboard designed to give you a real-time edge, featuring our proprietary Kiwi Trail signals, multi-exchange scanners, and powerful confluence filters.
                        </p>
                        <a href="#features" className="mt-8 inline-block px-8 py-3 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity text-lg">
                            View Features
                        </a>
                    </div>
                </section>
                
                <AnimatedSection id="features" className="py-20 sm:py-28">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-bold">Everything You Need to Find an Edge</h2>
                            <p className="mt-4 text-medium-text">From real-time signal tracking to automated alerts, Crysi is built for the serious trader.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, i) => (
                                <div key={i} className="creative-lock-bg p-6 backdrop-blur-md rounded-2xl shadow-lg border border-dark-border/50 transition-all duration-300 hover:border-primary/50 hover:-translate-y-2">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-dark-bg border-2 border-primary/50 text-primary text-2xl mb-4">
                                        <i className={`fa-solid ${feature.icon}`}></i>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-medium-text mb-4">{feature.description}</p>
                                    <div className="aspect-video bg-dark-bg/50 rounded-lg border border-dashed border-dark-border flex items-center justify-center mt-4">
                                        <p className="text-xs text-medium-text">Feature Preview</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
                
                <AnimatedSection id="get-started" className="py-20 sm:py-28">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-bold">Begin Your Journey</h2>
                            <p className="mt-4 text-medium-text">Connect your wallet to get instant access to the scanner.</p>
                        </div>
                        <div className="mt-16 max-w-md mx-auto flex flex-col gap-6">
                             <div className={`creative-lock-bg flex-1 p-6 backdrop-blur-md rounded-2xl shadow-2xl border border-dark-border/50 text-center transition-all duration-300 ${userAddress ? 'border-primary/50' : ''}`}>
                                <div className={`
                                    relative mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-dark-bg shadow-lg transition-colors
                                    ${!!isConnecting ? 'animate-spin-border !border-transparent' : userAddress ? 'border-2 border-primary/80 shadow-primary/20' : 'border-2 border-dark-border'}
                                `}>
                                    <i className={`fa-solid ${userAddress ? 'fa-check-circle' : 'fa-wallet'} text-3xl text-primary`}></i>
                                </div>
                                <h3 className="text-xl font-bold text-light-text">{userAddress ? 'Wallet Connected' : 'Connect Your Wallet'}</h3>
                                <p className="text-xs text-medium-text mt-1">{userAddress ? 'Ready for the next step.' : 'Select your preferred wallet to continue.'}</p>
                                <div className="text-xs text-medium-text italic my-4 border-t border-b border-dark-border py-3">
                                    Use this tool responsibly. You are accountable for your own actions.
                                </div>
                                {connectError && <p className="text-red-500 text-xs mb-2">{connectError}</p>}

                                {userAddress ? (
                                     <div className="w-full h-12 px-6 font-bold bg-dark-bg border border-dark-border rounded-lg flex items-center justify-center gap-2 text-primary">
                                         {subscribeStatus || `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
                                     </div>
                                ) : !showWalletList ? (
                                    <button
                                        onClick={() => setShowWalletList(true)}
                                        className="w-full h-12 px-6 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        Connect Wallet
                                    </button>
                                ) : (
                                    <div className="space-y-3 animate-fade-in-slow">
                                        {detectedWallets.length > 0 ? detectedWallets.map(walletType => {
                                            const wallet = WALLET_INFO[walletType];
                                            const isLoading = isConnecting === walletType;
                                            return (
                                                <button
                                                    key={walletType}
                                                    onClick={() => handleConnectWallet(walletType)}
                                                    disabled={!!isConnecting}
                                                    className="w-full h-12 px-4 font-semibold bg-dark-card/80 hover:bg-dark-border rounded-lg transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait"
                                                >
                                                    {isLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <WalletIcon walletType={walletType} />}
                                                    <span>{isLoading ? 'Connecting...' : `Connect ${wallet.name}`}</span>
                                                </button>
                                            );
                                        }) : (
                                            <p className="text-sm text-medium-text">No wallets detected. Please install a wallet like MetaMask or ensure it's enabled.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AnimatedSection>
            </main>
            <Footer />
        </div>
    );
};

export default GatewayPage;