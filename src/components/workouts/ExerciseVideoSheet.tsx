/**
 * ExerciseVideoSheet - Native Bottom Sheet for Exercise Videos
 * Build 18: Modal nativo com swipe para fechar
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Play } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useState } from "react";

interface ExerciseVideoSheetProps {
    exerciseName: string;
    videoUrl?: string;
    trigger?: React.ReactNode;
}

export const ExerciseVideoSheet = ({
    exerciseName,
    videoUrl,
    trigger
}: ExerciseVideoSheetProps) => {
    const { light } = useHapticFeedback();
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        light();
        setOpen(true);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Trigger Button */}
            <div onClick={handleOpen}>
                {trigger || (
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 active:scale-[0.98] transition-all border border-primary/20"
                    >
                        <Play className="w-4 h-4" />
                        <span>Ver demonstração</span>
                    </button>
                )}
            </div>

            <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-3xl p-0 bg-background border-t border-border/50"
            >
                {/* Indicador de swipe (drag handle) */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Header compacto */}
                <SheetHeader className="px-4 pb-3 border-b border-border/30">
                    <SheetTitle className="text-base font-semibold text-foreground line-clamp-2 text-left">
                        {exerciseName}
                    </SheetTitle>
                </SheetHeader>

                {/* Vídeo - Ocupa maior área possível */}
                <div className="p-4 flex-1 flex items-center justify-center h-[calc(100%-80px)]">
                    <VideoPlayer
                        exerciseName={exerciseName}
                        videoUrl={videoUrl}
                        className="w-full h-full max-h-full"
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ExerciseVideoSheet;
