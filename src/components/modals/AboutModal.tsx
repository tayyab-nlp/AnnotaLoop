import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Globe, Mail } from 'lucide-react';
import { check as checkUpdate } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-shell';
import { useToast } from '../../context/ToastContext';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InstallError {
    message: string;
    details: string;
    tips: string[];
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const [currentVersion, setCurrentVersion] = useState<string>('');
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateVersion, setUpdateVersion] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<{ downloaded: number; total: number } | null>(null);
    const [updateObject, setUpdateObject] = useState<Awaited<ReturnType<typeof checkUpdate>> | null>(null);
    const [lastCheckStatus, setLastCheckStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [installError, setInstallError] = useState<InstallError | null>(null);

    useEffect(() => {
        if (isOpen) {
            getVersion().then(setCurrentVersion).catch(() => setCurrentVersion('Unknown'));
        }
    }, [isOpen]);

    const handleCheckUpdate = async () => {
        setIsCheckingUpdate(true);
        setUpdateAvailable(false);
        setUpdateVersion('');

        try {
            const update = await checkUpdate();
            if (update) {
                setUpdateAvailable(true);
                setUpdateVersion(update.version);
                setUpdateObject(update);
                setLastCheckStatus('success');
                addToast(`Update available: v${update.version}`, 'success');
            } else {
                setLastCheckStatus('success');
                addToast('You are using the latest version', 'info');
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            setLastCheckStatus('error');
            // Use Vite's DEV flag - more reliable than checking protocol
            const isDev = import.meta.env.DEV;
            if (isDev) {
                addToast('Update checker only works in production builds', 'info');
            } else {
                // Show more specific error for debugging
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error && typeof error === 'object') {
                    errorMessage = JSON.stringify(error);
                }

                if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                    addToast('Update server unreachable. Check your internet connection.', 'error');
                } else {
                    addToast(`Update check failed: ${errorMessage}`, 'error');
                }
            }
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const parseInstallError = (e: any): InstallError => {
        const rawMessage = e?.message ?? String(e);

        if (rawMessage.includes('network') || rawMessage.includes('fetch') || rawMessage.includes('connection')) {
            return {
                message: 'Network Error',
                details: 'Could not download the update.',
                tips: ['Check your internet connection', 'Try disabling VPN or proxy']
            };
        }

        if (rawMessage.includes('signature') || rawMessage.includes('verify')) {
            return {
                message: 'Verification Failed',
                details: 'Update package could not be verified.',
                tips: ['Try again in a few minutes', 'Download from GitHub instead']
            };
        }

        if (rawMessage.includes('permission') || rawMessage.includes('EPERM')) {
            return {
                message: 'Permission Denied',
                details: 'Cannot write to application directory.',
                tips: ['Close other instances', 'Check disk permissions']
            };
        }

        return {
            message: 'Install Failed',
            details: rawMessage.length > 80 ? rawMessage.substring(0, 80) + '...' : rawMessage,
            tips: ['Try again later', 'Download from GitHub releases']
        };
    };

    const handleInstallUpdate = async () => {
        if (!updateObject) return;

        setIsDownloading(true);
        setInstallError(null);
        setDownloadProgress(null);

        try {
            let downloadedBytes = 0;

            await updateObject.downloadAndInstall((event) => {
                if (event.event === 'Started') {
                    const data = event.data as { contentLength?: number };
                    if (data.contentLength) {
                        setDownloadProgress({ downloaded: 0, total: data.contentLength });
                    }
                } else if (event.event === 'Progress') {
                    const data = event.data as { chunkLength: number; contentLength?: number };
                    downloadedBytes += data.chunkLength;
                    if (data.contentLength) {
                        setDownloadProgress({ downloaded: downloadedBytes, total: data.contentLength });
                    }
                }
            });

            addToast('Update installed! Restarting...', 'success');

            try {
                await relaunch();
            } catch (relaunchErr) {
                console.error('Relaunch failed:', relaunchErr);
                setInstallError({
                    message: 'Update Installed',
                    details: 'Please restart the app manually.',
                    tips: ['Close and reopen the application']
                });
            }
        } catch (error) {
            console.error('Failed to install update:', error);
            setInstallError(parseInstallError(error));
            addToast(`Update failed: ${(error as Error).message || 'Unknown error'}`, 'error');
        } finally {
            setIsDownloading(false);
            setDownloadProgress(null);
        }
    };

    const openExternal = async (url: string) => {
        try {
            await open(url);
        } catch (error) {
            console.error('Failed to open external link:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm">
            <div className="modal-content bg-white dark:bg-gray-800 w-[700px] max-h-[85vh] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold dark:text-white">AnnotaLoop</h2>
                            <p className="text-primary font-medium text-sm">Version {currentVersion || '...'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                AI-assisted document annotation with human-in-the-loop workflows
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content - 2 Column Layout */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column - Links & Contact */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Links & Contact</h3>

                            <button
                                onClick={() => openExternal('https://tayyab.io/annotaloop/')}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary block">Project Website</span>
                                    <span className="text-xs text-gray-500">tayyab.io/annotaloop</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                            </button>

                            <button
                                onClick={() => openExternal('https://github.com/tayyab-nlp/AnnotaLoop')}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary block">GitHub Repository</span>
                                    <span className="text-xs text-gray-500">View source & contribute</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                            </button>

                            <button
                                onClick={() => openExternal('mailto:hello@tayyab.io')}
                                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900 transition-all group flex items-center gap-3"
                            >
                                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary block">Contact</span>
                                    <span className="text-xs text-gray-500">hello@tayyab.io</span>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                            </button>
                        </div>

                        {/* Right Column - Updates */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Software Updates</h3>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                {installError ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-red-600 dark:text-red-400">{installError.message}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{installError.details}</p>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-2">
                                            <span className="font-medium">Tips:</span>
                                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                                {installError.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                                            </ul>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setInstallError(null); handleInstallUpdate(); }}
                                                className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                                Retry
                                            </button>
                                            <button
                                                onClick={() => window.open('https://github.com/tayyab-nlp/AnnotaLoop/releases', '_blank')}
                                                className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                GitHub
                                            </button>
                                        </div>
                                    </div>
                                ) : updateAvailable ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Update Available</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Version {updateVersion} is ready</p>
                                            </div>
                                        </div>
                                        {downloadProgress && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                    <span>Downloading...</span>
                                                    <span>{Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(downloadProgress.downloaded / downloadProgress.total) * 100}%` }} />
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
                                ) : lastCheckStatus === 'error' ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Check Failed</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Unable to check for updates</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCheckUpdate}
                                            disabled={isCheckingUpdate}
                                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                                            {isCheckingUpdate ? 'Checking...' : 'Try Again'}
                                        </button>
                                    </div>
                                ) : lastCheckStatus === 'success' ? (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Up to Date</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">You're running the latest version</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCheckUpdate}
                                            disabled={isCheckingUpdate}
                                            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                                            {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <RefreshCw className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">Updates</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Click to check for updates</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleCheckUpdate}
                                            disabled={isCheckingUpdate}
                                            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                                            {isCheckingUpdate ? 'Checking...' : 'Check for Updates'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Made with ❤️ by <button onClick={() => openExternal('https://tayyab.io')} className="text-primary hover:underline">Tayyab</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutModal;
