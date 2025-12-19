/**
 * COD System - Phase 2: Mobility Library Component
 * 
 * Shows recovery/mobility videos for rest days or low readiness days.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Play,
    Clock,
    Target as TargetIcon,
    Leaf,
    Wind,
    Dumbbell,
    Heart
} from 'lucide-react';
import { useMobilityLibrary, MobilityVideo } from '@/hooks/useMobilityLibrary';

interface MobilityLibraryProps {
    readinessLevel?: 'green' | 'yellow' | 'red' | null;
    onVideoSelect?: (video: MobilityVideo) => void;
    compact?: boolean;
}

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'stretching': return <Leaf className="w-4 h-4" />;
        case 'mobility': return <TargetIcon className="w-4 h-4" />;
        case 'foam_rolling': return <Dumbbell className="w-4 h-4" />;
        case 'yoga': return <Heart className="w-4 h-4" />;
        case 'breathing': return <Wind className="w-4 h-4" />;
        default: return <Leaf className="w-4 h-4" />;
    }
};

const getCategoryLabel = (category: string) => {
    switch (category) {
        case 'stretching': return 'Alongamento';
        case 'mobility': return 'Mobilidade';
        case 'foam_rolling': return 'Foam Rolling';
        case 'yoga': return 'Yoga';
        case 'breathing': return 'Respiração';
        default: return category;
    }
};

const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
};

export const MobilityLibrary: React.FC<MobilityLibraryProps> = ({
    readinessLevel,
    onVideoSelect,
    compact = false
}) => {
    const {
        filteredVideos,
        loading,
        error,
        categories,
        selectedCategory,
        filterByCategory,
        filterByRecommendation
    } = useMobilityLibrary();

    // Auto-filter based on readiness level
    React.useEffect(() => {
        if (readinessLevel === 'red') {
            filterByRecommendation('low_readiness');
        } else if (readinessLevel === 'yellow') {
            filterByRecommendation('rest_day');
        } else {
            filterByRecommendation(null);
        }
    }, [readinessLevel, filterByRecommendation]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-muted rounded w-48 mx-auto" />
                        <div className="h-32 bg-muted rounded" />
                        <div className="h-32 bg-muted rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-muted">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Leaf className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Biblioteca de mobilidade não disponível</p>
                </CardContent>
            </Card>
        );
    }

    if (filteredVideos.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum vídeo encontrado</p>
                    <p className="text-sm mt-2">
                        {selectedCategory
                            ? `Não há vídeos na categoria "${getCategoryLabel(selectedCategory)}"`
                            : 'Adicione vídeos de mobilidade no painel do personal'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (compact) {
        // Compact view - show top 3 videos
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-green-500" />
                        Recuperação Ativa
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {filteredVideos.slice(0, 3).map(video => (
                        <div
                            key={video.id}
                            className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onVideoSelect?.(video)}
                        >
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                {getCategoryIcon(video.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{video.title}</p>
                                <p className="text-xs text-muted-foreground">{formatDuration(video.duration_seconds)}</p>
                            </div>
                            <Play className="w-4 h-4 text-muted-foreground" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-500" />
                    Biblioteca de Mobilidade
                </CardTitle>
                {readinessLevel === 'red' && (
                    <p className="text-sm text-muted-foreground">
                        Sugestões para recuperação em dias de baixa prontidão
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => filterByCategory(null)}
                    >
                        Todos
                    </Button>
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={selectedCategory === cat ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => filterByCategory(cat)}
                            className="flex items-center gap-1"
                        >
                            {getCategoryIcon(cat)}
                            {getCategoryLabel(cat)}
                        </Button>
                    ))}
                </div>

                {/* Video Grid */}
                <div className="grid gap-3">
                    {filteredVideos.map(video => (
                        <div
                            key={video.id}
                            className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => onVideoSelect?.(video)}
                        >
                            {/* Thumbnail placeholder */}
                            <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Play className="w-6 h-6 text-green-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{video.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{video.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                        {getCategoryIcon(video.category)}
                                        <span className="ml-1">{getCategoryLabel(video.category)}</span>
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDuration(video.duration_seconds)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default MobilityLibrary;
