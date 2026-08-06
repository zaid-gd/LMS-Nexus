"use client";

import { useState, useCallback, useEffect } from "react";
import type { Roadmap, Section } from "@/types";
import { getStorage } from "@/lib/storage";

export function useRoadmap(id?: string, isSession: boolean = false) {
    const storage = getStorage();

    // Lazy state initialization (vercel best practice: 5.10)
    const [roadmap, setRoadmap] = useState<Roadmap | null>(() => {
        if (typeof window === "undefined" || !id) return null;
        const base = storage.getRoadmap(id);
        
        if (base && isSession) {
            // Merge session data (progress tracking only)
            const sessionData = localStorage.getItem(`zns:v1:session:${id}`);
            if (sessionData) {
                try {
                    const sessionSections = JSON.parse(sessionData);
                    return {
                        ...base,
                        sections: base.sections.map(s => {
                            const sessionSection = sessionSections.find((ss: Section) => ss.id === s.id);
                            return sessionSection ? { ...s, data: sessionSection.data } : s;
                        })
                    };
                } catch (e) {
                    return base;
                }
            }
        }
        return base;
    });

    const [roadmaps, setRoadmaps] = useState<Roadmap[]>(() => {
        if (typeof window === "undefined") return [];
        return storage.getRoadmaps();
    });

    // Refresh roadmaps list from storage
    const refreshList = useCallback(() => {
        setRoadmaps(storage.getRoadmaps());
    }, [storage]);

    // Load a specific roadmap
    const loadRoadmap = useCallback((roadmapId: string) => {
        const r = storage.getRoadmap(roadmapId);
        setRoadmap(r);
        return r;
    }, [storage]);

    // Save a new or updated roadmap
    const saveRoadmap = useCallback((r: Roadmap) => {
        storage.saveRoadmap(r);
        setRoadmap(r);
        setRoadmaps(storage.getRoadmaps());
    }, [storage]);

    // Delete a roadmap
    const deleteRoadmap = useCallback((roadmapId: string) => {
        storage.deleteRoadmap(roadmapId);
        if (roadmap?.id === roadmapId) setRoadmap(null);
        setRoadmaps(storage.getRoadmaps());
    }, [roadmap?.id, storage]);

    // Update a specific section within the roadmap (functional setState: 5.9)
    const updateSection = useCallback(
        (sectionId: string, updater: (section: Section) => Section) => {
            setRoadmap((prev) => {
                if (!prev) return prev;
                const updated: Roadmap = {
                    ...prev,
                    updatedAt: new Date().toISOString(),
                    sections: prev.sections.map((s) =>
                        s.id === sectionId ? updater(s) : s
                    ),
                };

                if (isSession) {
                    // Only save progress to session store
                    localStorage.setItem(`zns:v1:session:${id}`, JSON.stringify(updated.sections));
                } else {
                    storage.saveRoadmap(updated);
                }
                return updated;
            });
        },
        [id, isSession, storage]
    );

    // Sync on mount if id changes
    useEffect(() => {
        if (id) {
            const base = storage.getRoadmap(id);
            if (base && isSession) {
                const sessionData = localStorage.getItem(`zns:v1:session:${id}`);
                if (sessionData) {
                    try {
                        const sessionSections = JSON.parse(sessionData);
                        setRoadmap({
                            ...base,
                            sections: base.sections.map(s => {
                                const sessionSection = sessionSections.find((ss: Section) => ss.id === s.id);
                                return sessionSection ? { ...s, data: sessionSection.data } : s;
                            })
                        });
                        return;
                    } catch (e) {}
                }
            }
            setRoadmap(base);
        }
    }, [id, isSession, storage]);

    return {
        roadmap,
        roadmaps,
        refreshList,
        loadRoadmap,
        saveRoadmap,
        deleteRoadmap,
        updateSection,
    };
}
