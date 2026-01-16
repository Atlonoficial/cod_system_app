/**
 * ExerciseVideoSheet - Native Bottom Sheet for Exercise Videos
 * BUILD 51: Com instruções do admin e gradiente verde
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
    instructions?: string;
    notes?: string;
}

export const ExerciseVideoSheet = ({
    exerciseName,
    videoUrl,
    trigger,
    description,
    instructions,
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
    const hasInstructions = instructions && instructions.trim().length > 0;
    const hasNotes = notes && notes.trim().length > 0;
    const hasExtraContent = hasDescription || hasInstructions || hasNotes;

    // Process instructions formatting (***bold***)
    const processInstructions = (text: string) => {
        return text.split('\n').map((line, idx) => {
            // Replace ***text*** with bold
            const processedLine = line.replace(
                /\*\*\*(.+?)\*\*\*/g,
                '<strong class="text-foreground font-semibold">$1</strong>'
            );
            return (
                <p
                    key={idx}
                    className="mb-2 last:mb-0"
                    dangerouslySetInnerHTML={{ __html: processedLine }}
                />
            );
        });
    };

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

                    {/* Instruções do Admin - BUILD 51: Campo principal */}
                    {hasInstructions && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-teal-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Instruções
                                </h4>
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed pl-6">
                                {processInstructions(instructions)}
                            </div>
                        </div>
                    )}

                    {/* Descrição */}
                    {hasDescription && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-blue-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Descrição
                                </h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                                {description}
                            </p>
                        </div>
                    )}

                    {/* Observações */}
                    {hasNotes && (
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-amber-400" />
                                <h4 className="text-sm font-semibold text-foreground">
                                    Observações
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

                    {/* Botão de confirmação - BUILD 51: Gradiente verde (estilo Tutoriais) */}
                    <div className="mt-6 pb-4">
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                        >
                            Ok, entendi!
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default ExerciseVideoSheet;
