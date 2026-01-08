import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, RefreshCw, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { check as checkUpdate } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

import LLMConfigSection from './LLMConfigSection';
import CustomSelect, { type Option, type OptionGroup } from '../ui/CustomSelect';
import { useToast } from '../../context/ToastContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { security, setSecurity, settings, setSettings } = useApp();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'llm' | 'security' | 'general' | 'about'>('llm');
    const [activeSubTab, setActiveSubTab] = useState<'mistral' | 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'lmstudio'>('mistral');

    // PIN management state
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinError, setPinError] = useState('');

    // Update checking state
    const [currentVersion, setCurrentVersion] = useState('');
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateVersion, setUpdateVersion] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    // Reset tab to first tab when modal opens and load version
    React.useEffect(() => {
        if (isOpen) {
            setActiveTab('llm');
            setActiveSubTab('mistral');
            // Reset PIN state when modal opens
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setPinError('');
            // Load current version
            getVersion().then(setCurrentVersion).catch(() => setCurrentVersion('Unknown'));
        }
    }, [isOpen]);

    // Function to check for updates manually
    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateAvailable(false);
        setUpdateVersion('');

        try {
            const update = await checkUpdate();
            if (update) {
                setUpdateAvailable(true);
                setUpdateVersion(update.version);
                addToast(`Update available: v${update.version}`, 'success');
            } else {
                addToast('You are using the latest version', 'info');
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            addToast('Failed to check for updates', 'error');
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    // Function to install update
    const handleInstallUpdate = async () => {
        if (!updateAvailable) return;

        setIsDownloading(true);
        try {
            const update = await checkUpdate();
            if (update) {
                let downloaded = 0;
                let contentLength = 0;
                await update.downloadAndInstall((event) => {
                    switch (event.event) {
                        case 'Started':
                            contentLength = event.data.contentLength ?? 0;
                            console.log('Download started');
                            break;
                        case 'Progress':
                            downloaded += event.data.chunkLength;
                            if (contentLength > 0) {
                                setDownloadProgress(Math.round((downloaded / contentLength) * 100));
                            }
                            break;
                        case 'Finished':
                            console.log('Download finished');
                            break;
                    }
                });

                addToast('Update installed! Restarting...', 'success');
                await relaunch();
            }
        } catch (error) {
            console.error('Failed to install update:', error);
            addToast('Failed to install update', 'error');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(0);
        }
    };

    if (!isOpen) return null;

    const toggleAppLock = () => {
        setSecurity(prev => ({ ...prev, enabled: !prev.enabled }));
    };

    // PIN management functions
    const generateRecoveryKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const segments = [];
        for (let s = 0; s < 3; s++) {
            let segment = '';
            for (let i = 0; i < 4; i++) {
                segment += chars[Math.floor(Math.random() * chars.length)];
            }
            segments.push(segment);
        }
        return segments.join('-');
    };

    const handleSetupPin = () => {
        if (newPin.length !== 4) {
            setPinError('PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmPin) {
            setPinError('PINs do not match');
            return;
        }
        const recoveryKey = generateRecoveryKey();
        setSecurity(prev => ({ ...prev, pin: newPin, secret: recoveryKey }));
        setNewPin('');
        setConfirmPin('');
        setPinError('');
        addToast('PIN set successfully!', 'success');
    };

    const handleChangePin = () => {
        if (currentPin !== security.pin) {
            setPinError('Current PIN is incorrect');
            return;
        }
        if (newPin.length !== 4) {
            setPinError('New PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmPin) {
            setPinError('New PINs do not match');
            return;
        }
        setSecurity(prev => ({ ...prev, pin: newPin }));
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinError('');
        addToast('PIN changed successfully!', 'success');
    };

    const handleCopyKey = async () => {
        try {
            await navigator.clipboard.writeText(security.secret);
            addToast('Recovery key copied to clipboard', 'success');
        } catch {
            addToast('Failed to copy', 'error');
        }
    };

    const handleDownloadKey = () => {
        const content = `AnnotaLoop Recovery Key\n\nRecovery Key: ${security.secret}\n\nKeep this key in a safe place. You can use it to reset your PIN if you forget it.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotaloop-recovery-key.txt';
        a.click();
        URL.revokeObjectURL(url);
        addToast('Recovery key downloaded', 'success');
    };

    const handleRegenerateKey = () => {
        const newKey = generateRecoveryKey();
        setSecurity(prev => ({ ...prev, secret: newKey }));
        addToast('New recovery key generated', 'success');
    };

    const isFirstTimeSetup = !security.pin || security.pin.length !== 4;

    return (
        <div className="modal-overlay active fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
            <div className="modal-content bg-white dark:bg-gray-800 w-[900px] h-[650px] rounded-xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Sidebar */}
                <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Settings</h3>
                    <ul className="space-y-1">
                        <li onClick={() => setActiveTab('llm')} className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all ${activeTab === 'llm' ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>LLM Integration</li>
                        <li onClick={() => setActiveTab('security')} className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all ${activeTab === 'security' ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Security & Lock</li>
                        <li onClick={() => setActiveTab('general')} className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all ${activeTab === 'general' ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>General</li>
                        <li onClick={() => setActiveTab('about')} className={`px-3 py-2 rounded font-medium text-sm cursor-pointer transition-all ${activeTab === 'about' ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>About & Updates</li>
                    </ul>
                </div>

                {/* Content */}
                <div className="flex-grow p-8 overflow-y-auto bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 relative min-w-0 flex-1">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>

                    {activeTab === 'llm' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">LLM Integration</h2>

                            {/* Default Provider Dropdown */}
                            <div className="mb-6 relative z-30">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Select Default Model Provider</label>
                                {(() => {
                                    const connectedOptions: Option[] = [];
                                    const availableCloudOptions: Option[] = [];
                                    const availableLocalOptions: Option[] = [];

                                    // Helper to check connection
                                    const isConnected = (p: string) => settings.providers[p]?.models?.length > 0;

                                    // Definitions
                                    const providers = [
                                        { id: 'mistral', label: 'Mistral AI' },
                                        { id: 'openai', label: 'OpenAI' },
                                        { id: 'anthropic', label: 'Anthropic' },
                                        { id: 'gemini', label: 'Gemini' },
                                        { id: 'openrouter', label: 'OpenRouter' },
                                        { id: 'ollama', label: 'Ollama', isLocal: true },
                                        { id: 'lmstudio', label: 'LM Studio', isLocal: true },
                                    ];

                                    providers.forEach(p => {
                                        const connected = isConnected(p.id);
                                        // Add indicator if connected
                                        const label = connected ? `🟢 ${p.label}` : p.label;

                                        const option: Option = { value: p.label, label: label };

                                        if (connected) {
                                            connectedOptions.push(option);
                                        } else if (p.isLocal) {
                                            availableLocalOptions.push(option);
                                        } else {
                                            availableCloudOptions.push(option);
                                        }
                                    });

                                    const groupedOptions: OptionGroup[] = [
                                        { label: 'Connected', options: connectedOptions },
                                        { label: 'Available Cloud', options: availableCloudOptions },
                                        { label: 'Available Local', options: availableLocalOptions }
                                    ].filter(g => g.options.length > 0);

                                    return (
                                        <CustomSelect
                                            options={groupedOptions}
                                            value={settings.defaultProvider}
                                            onChange={(val) => {
                                                setSettings(prev => ({ ...prev, defaultProvider: val }));
                                                addToast(`Default provider set to ${val}`, 'info');
                                            }}
                                            placeholder="Select provider..."
                                        />
                                    );
                                })()}
                            </div>

                            {/* Cloud/Local Tabs */}
                            <div className="flex gap-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                                <button
                                    className={`pb-2 font-bold text-sm transition-colors ${!['ollama', 'lmstudio'].includes(activeSubTab) ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveSubTab('mistral')}
                                >
                                    Cloud LLMs
                                </button>
                                <button
                                    className={`pb-2 font-bold text-sm transition-colors ${['ollama', 'lmstudio'].includes(activeSubTab) ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    onClick={() => setActiveSubTab('ollama')}
                                >
                                    Local LLMs
                                </button>
                            </div>

                            {/* Provider Sub-Tabs */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
                                {!['ollama', 'lmstudio'].includes(activeSubTab) ? (
                                    // Cloud Tabs
                                    (['mistral', 'openai', 'anthropic', 'gemini', 'openrouter'] as const).map(provider => (
                                        <button
                                            key={provider}
                                            onClick={() => setActiveSubTab(provider)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSubTab === provider
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {provider === 'openrouter' ? 'OpenRouter' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                                        </button>
                                    ))
                                ) : (
                                    // Local Tabs
                                    (['ollama', 'lmstudio'] as const).map(provider => (
                                        <button
                                            key={provider}
                                            onClick={() => setActiveSubTab(provider)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSubTab === provider
                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {provider === 'lmstudio' ? 'LM Studio' : 'Ollama'}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Configuration Area */}
                            <div className="relative z-10">
                                <LLMConfigSection
                                    provider={activeSubTab}
                                    settings={settings}
                                    setSettings={setSettings}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">Security & App Lock</h2>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6 flex items-start gap-3">
                                <Lock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-yellow-700 dark:text-yellow-400">Enabling App Lock will require a 4-digit PIN every time you open or return to AnnotaLoop.</p>
                            </div>

                            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
                                <div>
                                    <div className="font-medium">Enable App Lock</div>
                                    <div className="text-xs text-gray-500">Secure application with PIN</div>
                                </div>
                                <button onClick={toggleAppLock} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${security.enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${security.enabled ? 'translate-x-6' : 'translate-x-1'}`}></span>
                                </button>
                            </div>

                            {security.enabled && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* PIN Setup/Change */}
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                                            {isFirstTimeSetup ? 'Set Up PIN' : 'Change PIN'}
                                        </label>

                                        {pinError && (
                                            <div className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded">
                                                {pinError}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {!isFirstTimeSetup && (
                                                <input
                                                    type="password"
                                                    value={currentPin}
                                                    onChange={(e) => setCurrentPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm tracking-widest text-center font-bold"
                                                    placeholder="Current PIN"
                                                />
                                            )}
                                            <input
                                                type="password"
                                                value={newPin}
                                                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm tracking-widest text-center font-bold"
                                                placeholder="New 4-digit PIN"
                                            />
                                            <input
                                                type="password"
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm tracking-widest text-center font-bold"
                                                placeholder="Confirm PIN"
                                            />
                                            <button
                                                onClick={isFirstTimeSetup ? handleSetupPin : handleChangePin}
                                                className="w-full px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded text-xs font-bold hover:opacity-90"
                                            >
                                                {isFirstTimeSetup ? 'Set PIN' : 'Update PIN'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recovery Key - only show after PIN is set */}
                                    {!isFirstTimeSetup && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="block text-xs font-bold text-gray-500 uppercase">Recovery Key</label>
                                                <button
                                                    onClick={handleRegenerateKey}
                                                    className="text-xs text-primary hover:underline font-medium"
                                                >
                                                    Generate New Key
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={security.secret}
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-300 pr-10"
                                                />
                                                <button
                                                    onClick={handleCopyKey}
                                                    className="absolute right-2 top-1.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    title="Copy to clipboard"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Save this key in a safe place. You can use it to reset your PIN if you forget it.
                                            </p>
                                            <button
                                                onClick={handleDownloadKey}
                                                className="mt-3 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                Download Recovery Key
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">General</h2>
                            <p className="text-gray-500">Application preferences and data management.</p>
                        </div>
                    )}

                    {activeTab === 'about' && (
                        <div>
                            <h2 className="text-xl font-bold mb-6">About & Updates</h2>

                            {/* App Information */}
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-xl">A</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">AnnotaLoop</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Version {currentVersion || 'Loading...'}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    AI-assisted document annotation with human-in-the-loop workflows.
                                </p>
                            </div>

                            {/* Update Check Section */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Software Updates</h3>
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {updateAvailable ? (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Update Available
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        Version {updateVersion} is ready to install
                                                    </p>
                                                </div>
                                            </div>
                                            {isDownloading && downloadProgress > 0 && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                        <span>Downloading...</span>
                                                        <span>{downloadProgress}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${downloadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button
                                                onClick={handleInstallUpdate}
                                                disabled={isDownloading}
                                                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                {isDownloading ? 'Installing...' : 'Install Update'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        Up to Date
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                        You're running the latest version
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCheckUpdate}
                                                disabled={isCheckingUpdate}
                                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                                                {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Links</h3>
                                <div className="space-y-2">
                                    <a
                                        href="https://github.com/tayyab-nlp/AnnotaLoop"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary">GitHub Repository</span>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
