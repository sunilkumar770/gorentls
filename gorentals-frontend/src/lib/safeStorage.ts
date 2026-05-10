/**
 * safeStorage.ts
 * A resilient wrapper for localStorage that handles SecurityError (sandboxed/private browsing)
 * by falling back to a cookie-based storage mechanism.
 */

type StorageValue = string | number | boolean | object | null;

class SafeStorage {
    private hasLocalStorage: boolean;

    constructor() {
        this.hasLocalStorage = this.testLocalStorage();
    }

    private testLocalStorage(): boolean {
        try {
            const testKey = "__storage_test__";
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    public getItem(key: string): string | null {
        if (this.hasLocalStorage) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return this.getCookie(key);
            }
        }
        return this.getCookie(key);
    }

    public setItem(key: string, value: string): void {
        if (this.hasLocalStorage) {
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                this.setCookie(key, value, 7);
            }
        } else {
            this.setCookie(key, value, 7);
        }
    }

    public removeItem(key: string): void {
        if (this.hasLocalStorage) {
            try {
                window.localStorage.removeItem(key);
            } catch (e) {
                this.deleteCookie(key);
            }
        } else {
            this.deleteCookie(key);
        }
    }

    private setCookie(name: string, value: string, days: number): void {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
    }

    private getCookie(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    private deleteCookie(name: string): void {
        document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
}

export const safeStorage = new SafeStorage();
