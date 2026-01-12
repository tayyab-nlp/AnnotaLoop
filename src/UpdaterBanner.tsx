import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import { AlertTriangle, Download, RefreshCw, X } from "lucide-react";

interface UpdateError {
    message: string;
    details: string;
    troubleshooting: string[];
}

export function UpdaterBanner() {
    const [update, setUpdate] = useState<Update | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<UpdateError | null>(null);
    const [progress, setProgress] = useState<{ downloaded: number; total: number } | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const u = await check();
                if (u) setUpdate(u);
            } catch (e: any) {
                console.error("Updater check failed:", e);
                // Silently fail on check - user can use About modal to check manually
            }
        })();
    }, []);

    const parseError = (e: any): UpdateError => {
        const rawMessage = e?.message ?? String(e);

        // Common error patterns and their user-friendly explanations
        if (rawMessage.includes("network") || rawMessage.includes("fetch") || rawMessage.includes("connection")) {
            return {
                message: "Network Error",
                details: "Could not connect to the update server.",
                troubleshooting: [
                    "Check your internet connection",
                    "Try disabling VPN or proxy",
                    "Firewall may be blocking the connection"
                ]
            };
        }

        if (rawMessage.includes("signature") || rawMessage.includes("verify")) {
            return {
                message: "Signature Verification Failed",
                details: "The update package could not be verified.",
                troubleshooting: [
                    "The update file may be corrupted",
                    "Try again in a few minutes",
                    "Download manually from GitHub releases"
                ]
            };
        }

        if (rawMessage.includes("permission") || rawMessage.includes("access denied") || rawMessage.includes("EPERM")) {
            return {
                message: "Permission Denied",
                details: "Cannot write to application directory.",
                troubleshooting: [
                    "Close other instances of the app",
                    "Run as administrator (Windows)",
                    "Check disk space and permissions"
                ]
            };
        }

        if (rawMessage.includes("relaunch") || rawMessage.includes("restart")) {
            return {
                message: "Restart Failed",
                details: "Update installed but app restart failed.",
                troubleshooting: [
                    "Manually close and reopen the app",
                    "The update will apply on next launch"
                ]
            };
        }

        // Generic error
        return {
            message: "Update Failed",
            details: rawMessage.length > 100 ? rawMessage.substring(0, 100) + "..." : rawMessage,
            troubleshooting: [
                "Try again in a few minutes",
                "Check your internet connection",
                "Download manually from GitHub releases"
            ]
        };
    };

    const handleUpdate = async () => {
        if (!update) return;

        setBusy(true);
        setError(null);
        setProgress(null);

        try {
            let downloadedBytes = 0;

            await update.downloadAndInstall((event) => {
                if (event.event === "Started") {
                    const data = event.data as { contentLength?: number };
                    if (data.contentLength) {
                        setProgress({ downloaded: 0, total: data.contentLength });
                    }
                } else if (event.event === "Progress") {
                    const data = event.data as { chunkLength: number; contentLength?: number };
                    downloadedBytes += data.chunkLength;
                    if (data.contentLength) {
                        setProgress({ downloaded: downloadedBytes, total: data.contentLength });
                    }
                } else if (event.event === "Finished") {
                    setProgress(null);
                }
            });

            // If we get here, download succeeded. Try to relaunch
            try {
                await relaunch();
            } catch (relaunchError) {
                // Relaunch failed but update is installed
                setError({
                    message: "Update Installed",
                    details: "Please restart the app manually to complete the update.",
                    troubleshooting: ["Close and reopen the application"]
                });
                setBusy(false);
            }
        } catch (e: any) {
            console.error("Update failed:", e);
            setError(parseError(e));
            setBusy(false);
            setProgress(null);
        }
    };

    const handleRetry = () => {
        setError(null);
        handleUpdate();
    };

    const formatBytes = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (dismissed || !update) return null;

    // Error state with detailed troubleshooting
    if (error) {
        return (
            <div className="bg-red-600 text-white px-4 py-3 shadow-lg animate-fade-in-down relative z-50">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{error.message}</span>
                            <button
                                onClick={() => setDismissed(true)}
                                className="p-1 hover:bg-red-700 rounded transition-colors"
                                title="Dismiss"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-red-100 text-sm mt-1">{error.details}</p>
                        <div className="mt-2 text-xs text-red-200">
                            <span className="font-medium">Troubleshooting:</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                                {error.troubleshooting.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={handleRetry}
                                className="px-3 py-1.5 bg-white text-red-600 rounded font-medium text-sm hover:bg-red-50 transition-colors flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Retry
                            </button>
                            <button
                                onClick={() => open("https://github.com/tayyab-nlp/AnnotaLoop/releases")}
                                className="px-3 py-1.5 bg-red-700 text-white rounded font-medium text-sm hover:bg-red-800 transition-colors"
                            >
                                Download from GitHub
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Progress state
    if (progress) {
        const percent = Math.round((progress.downloaded / progress.total) * 100);
        return (
            <div className="bg-blue-600 text-white px-4 py-3 shadow-md animate-fade-in-down relative z-50">
                <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 animate-pulse" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                                Downloading update {update.version}...
                            </span>
                            <span className="text-xs text-blue-100">
                                {formatBytes(progress.downloaded)} / {formatBytes(progress.total)} ({percent}%)
                            </span>
                        </div>
                        <div className="w-full bg-blue-400 rounded-full h-1.5">
                            <div
                                className="bg-white h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal update available state
    return (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md animate-fade-in-down relative z-50">
            <div className="font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                Update available: <span className="font-bold">{update.version}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => open('https://tayyab.io/annotaloop/releases/')}
                    className="px-3 py-1 text-blue-100 hover:text-white font-medium transition-colors flex items-center gap-1.5"
                >
                    What's New
                </button>
                <button
                    disabled={busy}
                    onClick={handleUpdate}
                    className="bg-white text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                    {busy ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        "Update now"
                    )}
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-blue-700 rounded transition-colors"
                    title="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
