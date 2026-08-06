import type { Roadmap, StorageProvider, StorageStatus } from "@/types";

export const ROADMAPS_KEY = "zns:v1:roadmaps";
const LEGACY_ROADMAPS_KEY = "zns_workspaces";

class LocalStorageProvider implements StorageProvider {
    private readStore(): Roadmap[] {
        try {
            const raw = localStorage.getItem(ROADMAPS_KEY);
            if (raw) return JSON.parse(raw) as Roadmap[];

            // One-time migration from legacy key.
            const legacy = localStorage.getItem(LEGACY_ROADMAPS_KEY);
            if (legacy) {
                const migrated = JSON.parse(legacy) as Roadmap[];
                localStorage.setItem(ROADMAPS_KEY, JSON.stringify(migrated));
                localStorage.removeItem(LEGACY_ROADMAPS_KEY);
                return migrated;
            }

            return [];
        } catch {
            return [];
        }
    }

    private writeStore(roadmaps: Roadmap[]): void {
        try {
            localStorage.setItem(ROADMAPS_KEY, JSON.stringify(roadmaps));
        } catch {
            // Quota exceeded or private browsing; fail silently.
        }
    }

    getRoadmaps(): Roadmap[] {
        return this.readStore();
    }

    getRoadmap(id: string): Roadmap | null {
        return this.readStore().find((r) => r.id === id) ?? null;
    }

    saveRoadmap(roadmap: Roadmap): void {
        const all = this.readStore();
        const idx = all.findIndex((r) => r.id === roadmap.id);
        if (idx >= 0) {
            all[idx] = roadmap;
        } else {
            all.unshift(roadmap);
        }

        this.writeStore(all);
    }

    deleteRoadmap(id: string): void {
        const all = this.readStore().filter((r) => r.id !== id);
        this.writeStore(all);
    }

    updateRoadmap(id: string, updates: Partial<Roadmap>): void {
        const all = this.readStore();
        const idx = all.findIndex((r) => r.id === id);
        if (idx < 0) return;

        const updated = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
        all[idx] = updated;
        this.writeStore(all);
    }

    clearRoadmaps(): void {
        const all = this.readStore();
        all.forEach((roadmap) => {
            localStorage.removeItem(`zns_versions_${roadmap.id}`);
            localStorage.removeItem(`zns:v1:session:${roadmap.id}`);
        });
        localStorage.removeItem(ROADMAPS_KEY);
        localStorage.removeItem(LEGACY_ROADMAPS_KEY);
    }
}

let _instance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
    if (!_instance) _instance = new LocalStorageProvider();
    return _instance;
}

export function getRoadmapsBackupJson(): string {
    return localStorage.getItem(ROADMAPS_KEY) || "[]";
}

export async function getStorageStatus(): Promise<StorageStatus> {
    return {
        mode: "local-only",
        cloudAvailable: false,
        email: null,
    };
}
