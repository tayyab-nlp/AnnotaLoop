/**
 * Secure Storage Service
 * Handles encrypted storage of sensitive data like API keys using Tauri's secure store
 */

import { Store } from '@tauri-apps/plugin-store';

const SECURE_STORE_FILE = 'secure.dat';
let storeInstance: Store | null = null;

/**
 * Get secure store instance
 */
async function getSecureStore(): Promise<Store> {
    if (!storeInstance) {
        storeInstance = await Store.load(SECURE_STORE_FILE);
    }
    return storeInstance;
}

/**
 * Save API key securely
 * @param provider - Provider name (e.g., 'openai', 'anthropic')
 * @param apiKey - API key to encrypt and store
 */
export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.set(`apikey_${provider}`, apiKey);
        await store.save();
        console.log(`[SecureStorage] Saved API key for provider: ${provider}`);
    } catch (error) {
        console.error('[SecureStorage] Failed to save API key:', error);
        throw error;
    }
}

/**
 * Get API key from secure storage
 * @param provider - Provider name
 * @returns Decrypted API key or null if not found
 */
export async function getApiKey(provider: string): Promise<string | null> {
    try {
        const store = await getSecureStore();
        const key = await store.get<string>(`apikey_${provider}`);
        return key ?? null;
    } catch (error) {
        console.error('[SecureStorage] Failed to get API key:', error);
        return null;
    }
}

/**
 * Delete API key from secure storage
 * @param provider - Provider name
 */
export async function deleteApiKey(provider: string): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.delete(`apikey_${provider}`);
        await store.save();
        console.log(`[SecureStorage] Deleted API key for provider: ${provider}`);
    } catch (error) {
        console.error('[SecureStorage] Failed to delete API key:', error);
        throw error;
    }
}

/**
 * Check if API key exists for a provider
 * @param provider - Provider name
 * @returns True if key exists
 */
export async function hasApiKey(provider: string): Promise<boolean> {
    try {
        const store = await getSecureStore();
        const key = await store.get<string>(`apikey_${provider}`);
        return key !== null && key !== undefined;
    } catch (error) {
        console.error('[SecureStorage] Failed to check API key:', error);
        return false;
    }
}

/**
 * Migrate plain-text API keys from localStorage to secure storage
 * This should be called once on app startup
 */
export async function migrateApiKeys(): Promise<void> {
    try {
        const settingsJson = localStorage.getItem('settings');
        if (!settingsJson) return;

        const settings = JSON.parse(settingsJson);
        if (!settings.providers) return;

        let migrated = false;
        const providers = ['openai', 'anthropic', 'mistral', 'gemini', 'openrouter'];

        for (const provider of providers) {
            const providerConfig = settings.providers[provider];
            if (providerConfig?.apiKey) {
                // Save to secure storage
                await saveApiKey(provider, providerConfig.apiKey);

                // Remove from settings object
                delete providerConfig.apiKey;
                migrated = true;

                console.log(`[SecureStorage] Migrated API key for ${provider}`);
            }
        }

        if (migrated) {
            // Save updated settings without API keys
            localStorage.setItem('settings', JSON.stringify(settings));
            console.log('[SecureStorage] Migration complete - API keys moved to secure storage');
        }
    } catch (error) {
        console.error('[SecureStorage] Failed to migrate API keys:', error);
        throw error;
    }
}

/**
 * Save base URL securely (for local LLM providers)
 * @param provider - Provider name
 * @param baseUrl - Base URL
 */
export async function saveBaseUrl(provider: string, baseUrl: string): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.set(`baseurl_${provider}`, baseUrl);
        await store.save();
    } catch (error) {
        console.error('[SecureStorage] Failed to save base URL:', error);
        throw error;
    }
}

/**
 * Get base URL from secure storage
 * @param provider - Provider name
 * @returns Base URL or null
 */
export async function getBaseUrl(provider: string): Promise<string | null> {
    try {
        const store = await getSecureStore();
        const url = await store.get<string>(`baseurl_${provider}`);
        return url ?? null;
    } catch (error) {
        console.error('[SecureStorage] Failed to get base URL:', error);
        return null;
    }
}

/**
 * Clear all secure storage data
 */
export async function clearSecureStorage(): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.clear();
        await store.save();
        console.log('[SecureStorage] Cleared all secure data');
    } catch (error) {
        console.error('[SecureStorage] Failed to clear storage:', error);
        throw error;
    }
}

// ============================================
// Security State Storage (App Lock)
// ============================================

export interface SecurityState {
    enabled: boolean;
    pin: string;
    secret: string;
    locked: boolean;
}

const DEFAULT_SECURITY: SecurityState = {
    enabled: false,
    pin: '1234',
    secret: 'A7X9-B2M4-L8Q1',
    locked: false
};

/**
 * Save security state to secure storage
 */
export async function saveSecurityState(security: SecurityState): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.set('security_enabled', security.enabled);
        await store.set('security_pin', security.pin);
        await store.set('security_secret', security.secret);
        // Note: We don't persist 'locked' state - it should always lock on fresh load if enabled
        await store.save();
        console.log('[SecureStorage] Saved security state');
    } catch (error) {
        console.error('[SecureStorage] Failed to save security state:', error);
        throw error;
    }
}

/**
 * Load security state from secure storage
 */
export async function loadSecurityState(): Promise<SecurityState> {
    try {
        const store = await getSecureStore();
        const enabled = await store.get<boolean>('security_enabled');
        const pin = await store.get<string>('security_pin');
        const secret = await store.get<string>('security_secret');

        // If no data found, return defaults
        if (enabled === null || enabled === undefined) {
            return { ...DEFAULT_SECURITY };
        }

        return {
            enabled: enabled,
            pin: pin ?? DEFAULT_SECURITY.pin,
            secret: secret ?? DEFAULT_SECURITY.secret,
            locked: enabled // If enabled, start locked
        };
    } catch (error) {
        console.error('[SecureStorage] Failed to load security state:', error);
        return { ...DEFAULT_SECURITY };
    }
}

/**
 * Clear security state from secure storage (for factory reset)
 */
export async function clearSecurityState(): Promise<void> {
    try {
        const store = await getSecureStore();
        await store.delete('security_enabled');
        await store.delete('security_pin');
        await store.delete('security_secret');
        await store.save();
        console.log('[SecureStorage] Cleared security state');
    } catch (error) {
        console.error('[SecureStorage] Failed to clear security state:', error);
        throw error;
    }
}

/**
 * Clear old security state from localStorage (migration disabled - fresh start)
 * Previous versions stored security in localStorage which persists across installs.
 * We now just clear it to give users a fresh start.
 */
export async function migrateSecurityFromLocalStorage(): Promise<void> {
    try {
        // Just clear any old localStorage security data - don't migrate it
        // This ensures fresh installs start without the lock screen
        const localStorageSecurity = localStorage.getItem('security');
        if (localStorageSecurity) {
            console.log('[SecureStorage] Found old localStorage security data - clearing it');
            localStorage.removeItem('security');
        }

        // Check if Tauri store has security data
        const store = await getSecureStore();
        const existingEnabled = await store.get<boolean>('security_enabled');

        // If no security in Tauri store, we're done - user will see app without lock
        if (existingEnabled === null || existingEnabled === undefined) {
            console.log('[SecureStorage] No security data in Tauri store - clean slate');
        }
    } catch (error) {
        console.error('[SecureStorage] Failed to clear old security data:', error);
    }
}

