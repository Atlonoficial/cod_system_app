/**
 * COD System - Phase 2: Mobility Library Hook
 * 
 * Provides access to mobility/recovery videos for rest days
 * or low readiness days.
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MobilityVideo {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url?: string;
    duration_seconds: number;
    category: 'stretching' | 'mobility' | 'foam_rolling' | 'yoga' | 'breathing';
    target_areas: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    recommended_for: 'rest_day' | 'low_readiness' | 'warmup' | 'cooldown' | 'any';
}

export interface UseMobilityLibraryResult {
    videos: MobilityVideo[];
    loading: boolean;
    error: string | null;

    // Filters
    filterByCategory: (category: string | null) => void;
    filterByRecommendation: (recommendation: string | null) => void;

    // Current filters
    selectedCategory: string | null;
    selectedRecommendation: string | null;

    // Computed
    categories: string[];
    filteredVideos: MobilityVideo[];
}

export const useMobilityLibrary = (): UseMobilityLibraryResult => {
    const [videos, setVideos] = useState<MobilityVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

    // Fetch videos on mount
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data, error: fetchError } = await supabase
                    .from('mobility_videos')
                    .select('*')
                    .order('title', { ascending: true });

                if (fetchError) {
                    // Table doesn't exist yet
                    if (fetchError.code === '42P01') {
                        console.log('[MobilityLibrary] Table not found - feature not yet available');
                        // Provide some default videos for demonstration
                        setVideos([]);
                        return;
                    }
                    throw fetchError;
                }

                setVideos((data as MobilityVideo[]) || []);
            } catch (err: any) {
                console.error('[MobilityLibrary] Error:', err);
                setError(err.message);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    // Filter functions
    const filterByCategory = useCallback((category: string | null) => {
        setSelectedCategory(category);
    }, []);

    const filterByRecommendation = useCallback((recommendation: string | null) => {
        setSelectedRecommendation(recommendation);
    }, []);

    // Get unique categories
    const categories = [...new Set(videos.map(v => v.category))];

    // Apply filters
    const filteredVideos = videos.filter(video => {
        if (selectedCategory && video.category !== selectedCategory) return false;
        if (selectedRecommendation && video.recommended_for !== selectedRecommendation && video.recommended_for !== 'any') return false;
        return true;
    });

    return {
        videos,
        loading,
        error,
        filterByCategory,
        filterByRecommendation,
        selectedCategory,
        selectedRecommendation,
        categories,
        filteredVideos
    };
};

export default useMobilityLibrary;
