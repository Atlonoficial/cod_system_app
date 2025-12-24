/**
 * COD System - Native Bottom Sheet Component
 * 
 * Wrapper around vaul Drawer for consistent native-feeling bottom sheets.
 * Use this instead of Dialog for mobile-first modals.
 */

import React from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NativeBottomSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    showHandle?: boolean;
    showCloseButton?: boolean;
    snapPoints?: (number | string)[];
    className?: string;
}

export const NativeBottomSheet: React.FC<NativeBottomSheetProps> = ({
    open,
    onOpenChange,
    children,
    title,
    description,
    showHandle = true,
    showCloseButton = true,
    snapPoints,
    className
}) => {
    return (
        <Drawer.Root
            open={open}
            onOpenChange={onOpenChange}
            snapPoints={snapPoints}
        >
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content
                    className={cn(
                        "fixed bottom-0 left-0 right-0 z-50",
                        "bg-background rounded-t-2xl",
                        "flex flex-col",
                        "max-h-[96vh]",
                        "outline-none",
                        className
                    )}
                >
                    {/* Native drag handle */}
                    {showHandle && (
                        <div className="py-3 flex justify-center">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>
                    )}

                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                            <div className="flex-1">
                                {title && (
                                    <Drawer.Title className="text-lg font-semibold">
                                        {title}
                                    </Drawer.Title>
                                )}
                                {description && (
                                    <Drawer.Description className="text-sm text-muted-foreground mt-0.5">
                                        {description}
                                    </Drawer.Description>
                                )}
                            </div>
                            {showCloseButton && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Content with safe area padding */}
                    <div className="flex-1 overflow-auto px-4 py-4 pb-safe">
                        {children}
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};

/**
 * Bottom Sheet Trigger - wraps the trigger element
 */
export const NativeBottomSheetTrigger = Drawer.Trigger;

/**
 * Bottom Sheet Close - closes the sheet
 */
export const NativeBottomSheetClose = Drawer.Close;

export default NativeBottomSheet;
