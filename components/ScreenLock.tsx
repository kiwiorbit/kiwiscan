import React, { useState, useRef, useEffect } from 'react';

interface ScreenLockProps {
    onUnlock: () => void;
}

const ScreenLock: React.FC<ScreenLockProps> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'plugin') {
            setError('');
            onUnlock();
        } else {
            setError('Incorrect Password');
            setPassword('');
            if (containerRef.current) {
                containerRef.current.classList.add('animate-shake');
                setTimeout(() => {
                    containerRef.current?.classList.remove('animate-shake');
                }, 500);
            }
        }
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="fixed inset-0 bg-dark-bg/90 backdrop-blur-sm flex justify-center items-center z-[9999]">
            <style>
                {`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                    .animate-shake {
                        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                    }
                `}
            </style>
            <div ref={containerRef} className="creative-lock-bg w-full max-w-sm p-6 backdrop-blur-md rounded-2xl shadow-2xl border border-dark-border/50">
                <div className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-dark-bg border-2 border-primary/50 shadow-lg shadow-primary/20">
                        <i className="fa-solid fa-moon text-3xl text-primary"></i>
                    </div>
                    <h2 className="text-xl font-bold text-light-text">Guidance Before You Begin</h2>
                    <p className="text-xs text-medium-text mt-1">Enter password to proceed with clarity.</p>

                    <div className="text-xs text-medium-text italic my-4 border-t border-b border-dark-border py-3 space-y-2">
                        <p>
                            <b>Developer's Note:</b> Please use this tool in accordance with Islamic principles. Stay away from Haram assets and remember, do not trade your next life for the short-term gains of this one.
                        </p>
                        <p className="font-semibold text-light-text/90">
                            Everyone is accountable for their own deeds. The developer will not bear responsibility for your actions on the Day of Judgement.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div>
                        <input
                            ref={inputRef}
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="Password"
                            className={`w-full h-10 rounded-lg bg-dark-bg px-4 text-light-text outline-none border ${error ? 'border-red-500' : 'border-dark-border'} focus:ring-2 focus:ring-primary text-center`}
                            aria-label="Password"
                            aria-invalid={!!error}
                            aria-describedby="password-error"
                        />
                         {error && <p id="password-error" className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                    </div>
                    <div className="mt-4">
                        <button
                            type="submit"
                            className="w-full h-10 px-6 font-bold text-dark-bg bg-primary rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            Unlock <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScreenLock;