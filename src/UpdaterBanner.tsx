import { useEffect, useState } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdaterBanner() {
    const [update, setUpdate] = useState<Update | null>(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const u = await check();
                if (u) setUpdate(u);
            } catch (e: any) {
                console.error("Updater check failed:", e);
                setErr(e?.message ?? String(e));
            }
        })();
    }, []);

    if (err && !update) return null; // Hide error if no update to avoid clutter
    if (!update) return null;

    return (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-sm shadow-md animate-fade-in-down relative z-50">
            <div className="font-medium">
                Update available: <span className="font-bold">{update.version}</span>
            </div>
            <button
                disabled={busy}
                onClick={async () => {
                    setBusy(true);
                    try {
                        await update.downloadAndInstall();
                        await relaunch();
                    } catch (e) {
                        console.error("Update failed:", e);
                        setBusy(false);
                    }
                }}
                className="bg-white text-blue-600 px-3 py-1 rounded-md font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
                {busy ? "Updating..." : "Update now"}
            </button>
        </div>
    );
}
