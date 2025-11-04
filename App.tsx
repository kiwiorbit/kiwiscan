
import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import CryptoHeader from './components/CryptoHeader';
import KiwiTrailGrid from './components/KiwiTrailGrid';
import SettingsPanel from './components/SettingsPanel';
import Footer from './components/Footer';
import AssetListModal from './components/AssetListModal';
import AlertsModal from './components/AlertsModal';
import AlertLogModal from './components/AlertLogModal';
import TableSettingsModal from './components/TableSettingsModal';
import PriceDetailPage from './components/PriceDetailPage';
import PriceDetailModal from './components/PriceDetailModal';
import AutomationModal from './components/AutomationModal';
import MexcScannerPage from './components/MexcScannerPage';
import GatewayPage from './components/GatewayPage';

// === Splash Screen Component ===
const SplashScreen: React.FC = () => {
  return (
    <div className="splash-screen" aria-live="polite" aria-label="Loading Crysi Scanner">
      <div className="splash-content">
        <svg className="splash-logo" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M 10 70 L 40 20 L 60 60 L 90 10 L 120 70 L 150 30 L 190 60" />
        </svg>
        <h1 className="splash-title">Crysi Scanner</h1>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
    const {
        isInitializing,
        settings,
        favorites,
        userSymbols,
        allSymbols,
        showFavoritesOnly,
        isConfluenceFilterActive,
        handleSettingChange,
        handleAlertConditionChange,
        handleColumnVisibilityChange,
        toggleFavorite,
        handleShowFavoritesOnlyToggle,
        handleToggleConfluenceFilter,
        handleSaveAssetList,
        handleResetSettings,
        timeframe,
        activeToast,
        notifications,
        alertLog,
        handleClearAlertLog,
        handleToastFinished,
        markNotificationsAsRead,
        clearNotifications,
        ToastContainer,
        handleNotificationClick,
        appScreen,
        activeSymbol,
        modalInitialState,
        isSettingsOpen,
        isAssetModalOpen,
        isAlertsModalOpen,
        isAlertLogOpen,
        isTableSettingsModalOpen,
        isChartModalOpen,
        isAutomationModalOpen,
        handleBackToScanner,
        handleSettingsToggle,
        setIsSettingsOpen,
        setIsAssetModalOpen,
        setIsAlertsModalOpen,
        setIsAlertLogOpen,
        setIsTableSettingsModalOpen,
        setIsChartModalOpen,
        setIsAutomationModalOpen,
        searchTerm,
        handleSearchChange,
        displayedSymbols,
        isLocked,
        userAddress,
        connectWallet,
        disconnectWallet,
        handleKiwiTrailCellClick,
        scannerType,
        handleScannerTypeChange,
        isSubscribed,
        handleSubscribe,
    } = useAppContext();

    if (isInitializing) return <SplashScreen />;
    
    // DEV NOTE: Temporarily disabled GatewayPage to allow development on the main app.
    // To re-enable, uncomment the following block.
    
    if (isLocked || !isSubscribed) {
        return (
            <GatewayPage 
                onConnect={connectWallet}
                onSubscribe={handleSubscribe}
                userAddress={userAddress}
            />
        );
    }

    
    const isChartPageVisible = appScreen === 'chart';

    return (
        <div className={`app-root-container bg-dark-bg ${isChartPageVisible ? 'show-chart' : ''}`}>
            <ToastContainer toast={activeToast} onFinish={handleToastFinished} onClick={handleNotificationClick} />
            
            <div className="aurora-container">
                <div className="aurora-shape aurora-shape1"></div>
                <div className="aurora-shape aurora-shape2"></div>
                <div className="aurora-shape aurora-shape3"></div>
            </div>

            {/* Scanner Page */}
            <div className="scanner-page-wrapper">
                <div className="relative min-h-screen text-light-text font-sans flex flex-col">
                    <div className="relative z-10 px-4 sm:px-8 py-4 flex-grow">
                        <CryptoHeader
                            onSettingsToggle={handleSettingsToggle}
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                            notifications={notifications}
                            onClearNotifications={clearNotifications}
                            onMarkNotificationsRead={markNotificationsAsRead}
                            onNotificationClick={handleNotificationClick}
                            showFavoritesOnly={showFavoritesOnly}
                            onShowFavoritesOnlyToggle={handleShowFavoritesOnlyToggle}
                            isConfluenceFilterActive={isConfluenceFilterActive}
                            onToggleConfluenceFilter={handleToggleConfluenceFilter}
                            scannerType={scannerType}
                            onScannerTypeChange={handleScannerTypeChange}
                        />
                        <main className="pt-40 md:pt-24">
                            {scannerType === 'cex' ? (
                                <KiwiTrailGrid 
                                    symbols={displayedSymbols} 
                                    onKiwiTrailCellClick={handleKiwiTrailCellClick} 
                                    settings={settings} 
                                    favorites={favorites} 
                                    onToggleFavorite={toggleFavorite} 
                                    isConfluenceFilterActive={isConfluenceFilterActive}
                                />
                            ) : (
                                <MexcScannerPage />
                            )}
                        </main>
                    </div>
                     <SettingsPanel 
                        isOpen={isSettingsOpen} 
                        onClose={() => setIsSettingsOpen(false)} 
                        onOpenAssetModal={() => setIsAssetModalOpen(true)}
                        onOpenAlertsModal={() => setIsAlertsModalOpen(true)}
                        onOpenAlertLogModal={() => setIsAlertLogOpen(true)}
                        onOpenTableSettingsModal={() => setIsTableSettingsModalOpen(true)}
                        onOpenAutomationModal={() => setIsAutomationModalOpen(true)}
                        onReset={handleResetSettings}
                        settings={settings}
                        onSettingChange={handleSettingChange}
                        userAddress={userAddress}
                        disconnectWallet={disconnectWallet}
                    />
                     <AlertsModal
                        isOpen={isAlertsModalOpen}
                        onClose={() => setIsAlertsModalOpen(false)}
                        settings={settings}
                        onAlertConditionChange={handleAlertConditionChange}
                    />
                    <AlertLogModal
                        isOpen={isAlertLogOpen}
                        onClose={() => setIsAlertLogOpen(false)}
                        alertLog={alertLog}
                        onClearLog={handleClearAlertLog}
                    />
                    <TableSettingsModal
                        isOpen={isTableSettingsModalOpen}
                        onClose={() => setIsTableSettingsModalOpen(false)}
                        visibleColumns={settings.visibleColumns}
                        onColumnVisibilityChange={handleColumnVisibilityChange}
                    />
                    <AssetListModal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} onSave={handleSaveAssetList} allSymbols={allSymbols} currentSymbols={userSymbols} />
                    <AutomationModal 
                        isOpen={isAutomationModalOpen}
                        onClose={() => setIsAutomationModalOpen(false)}
                        settings={settings}
                        onSettingChange={handleSettingChange}
                    />
                    <Footer />
                </div>
            </div>

            {/* Chart Page */}
            <div className="chart-page-wrapper">
                {isChartPageVisible && activeSymbol && <PriceDetailPage />}
            </div>

            {/* Chart Modal */}
            {isChartModalOpen && activeSymbol && (
                <PriceDetailModal 
                    symbol={activeSymbol}
                    timeframe={timeframe}
                    settings={settings}
                    onClose={() => setIsChartModalOpen(false)}
                    initialState={modalInitialState}
                />
            )}
        </div>
    );
}

const App: React.FC = () => (
    <AppProvider>
        <AppContent />
    </AppProvider>
);

export default App;
