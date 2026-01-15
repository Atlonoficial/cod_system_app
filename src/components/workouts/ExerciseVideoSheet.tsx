/**
 * ExerciseVideoSheet - Native Bottom Sheet for Exercise Videos
 * BUILD 50: Otimizado com descrição/orientações e altura compacta
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Play, FileText, Info } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useState } from "react";

interface ExerciseVideoSheetProps {
    exerciseName: string;
    videoUrl?: string;
    trigger?: React.ReactNode;
    description?: string;
    notes?: string;
}

export const ExerciseVideoSheet = ({
    exerciseName,
    videoUrl,
    trigger,
    description,
    notes
}: ExerciseVideoSheetProps) => {
    const { light } = useHapticFeedback();
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        light();
        setOpen(true);
    };

    // Check if we have any content to show besides video
    const hasDescription = description && !/^\d+$/.test(description.trim());
    const hasNotes = notes && notes.trim().length > 0;
    const hasExtraContent = hasDescription || hasNotes;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {/* Trigger Button */}
            <div onClick={handleOpen}>
                {trigger || (
                    <button
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
                    >
                        <Play className="w-4 h-4" />
                        <span>Ver demonstração</span>
                    </button>
                )}
            </div>

            {/* BUILD 50: Reduced height from 85vh to 70vh, scrollable content */}
            <SheetContent
                side="bottom"
                className="h-[70vh] rounded-t-3xl p-0 bg-background border-t border-border/50"
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Header compacto */}
                <SheetHeader className="px-4 pb-3 border-b border-border/30">
                    <SheetTitle className="text-base font-semibold text-foreground line-clamp-2 text-left">
                        {exerciseName}
                    </SheetTitle>
                </SheetHeader>

                {/* Scrollable content area */}
                <div className="overflow-y-auto h-[calc(70vh-80px)] px-4 py-4">
                    {/* Vídeo - Aspect ratio 16:9 */}
                    <div className="mb-4">
                        <VideoPlayer
                            exerciseName={exerciseName}
                            videoUrl={videoUrl}
                            className="w-full aspect-video rounded-xl overflow-hidden"
                        />
                    </div>

                    {/* Descrição */}
                    {hasDescription && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Descrição
                                </h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                {description}
                            </p>
                        </div>
                    )}

                    {/* Orientações */}
                    {hasNotes && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-amber-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Orientações
                                </h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pl-6">
                                {notes}
                            </p>
                        </div>
                    )}

                    {/* Mensagem se não houver conteúdo extra */}
                    {!hasExtraContent && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Assista ao vídeo demonstrativo para executar o exercício corretamente.
                        </p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ExerciseVideoSheet;
