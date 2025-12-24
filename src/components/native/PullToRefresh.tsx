/**
 * COD System - Native Pull to Refresh Component
 * 
 * Provides native-feeling pull-to-refresh functionality for mobile.
 * Uses touch events and haptic feedback for authentic iOS/Android feel.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
    disabled?: boolean;
    className?: string;
    threshold?: number; // pixels to pull before triggering refresh
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    children,
    onRefresh,
    disabled = false,
    className,
    threshold = 80
}) => {
    const haptics = useHapticFeedback();
    const containerRef = useRef<HTMLDivElement>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const [triggeredHaptic, setTriggeredHaptic] = useState(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isRefreshing) return;

        // Only start if at top of scroll
        const container = containerRef.current;
        if (container && container.scrollTop === 0) {
            setStartY(e.touches[0].clientY);
            setIsPulling(true);
            setTriggeredHaptic(false);
        }
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || disabled || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            // Apply resistance to the pull
            const resistance = 0.4;
            const distance = diff * resistance;
            setPullDistance(Math.min(distance, threshold * 1.5));

            // Trigger haptic when threshold is reached
            if (distance >= threshold && !triggeredHaptic) {
                haptics.medium();
                setTriggeredHaptic(true);
            }
        }
    }, [isPulling, startY, disabled, isRefreshing, threshold, haptics, triggeredHaptic]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            haptics.success();

            try {
                await onRefresh();
            } catch (error) {
                console.error('[PullToRefresh] Refresh failed:', error);
                haptics.error();
            } finally {
                setIsRefreshing(false);
            }
        }

        setPullDistance(0);
        setIsPulling(false);
        setStartY(0);
    }, [pullDistance, threshold, isRefreshing, onRefresh, haptics, isPulling]);

    // Smooth transition when releasing
    useEffect(() => {
        if (!isPulling && !isRefreshing && pullDistance > 0) {
            const timer = setTimeout(() => setPullDistance(0), 300);
            return () => clearTimeout(timer);
        }
    }, [isPulling, isRefreshing, pullDistance]);

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 180;

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-auto", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <div
                className="absolute left-0 right-0 flex items-center justify-center z-10 pointer-events-none transition-transform duration-200"
                style={{
                    top: -40,
                    transform: `translateY(${pullDistance}px)`,
                    opacity: progress
                }}
            >
                <div className={cn(
                    "w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center",
                    isRefreshing && "bg-primary/20"
                )}>
                    {isRefreshing ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                        <ArrowDown
                            className="w-5 h-5 text-primary transition-transform duration-150"
                            style={{ transform: `rotate(${rotation}deg)` }}
                        />
                    )}
                </div>
            </div>

            {/* Content with offset when pulling */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: isRefreshing
                        ? `translateY(${threshold * 0.3}px)`
                        : `translateY(${pullDistance * 0.5}px)`
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
