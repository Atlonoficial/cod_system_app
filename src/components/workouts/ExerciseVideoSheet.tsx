/**
 * ExerciseVideoSheet - Fullscreen Modal for Exercise Videos
 * BUILD 56: Transformed from bottom sheet to fullscreen modal (matching WorkoutDetail style)
 */

import { X, Play, FileText, Info } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { useExerciseVideo } from "@/hooks/useExerciseVideo";
import { useState } from "react";

interface ExerciseVideoSheetProps {
    exerciseName: string;
    videoUrl?: string;
    trigger?: React.ReactNode;
    description?: string;
    instructions?: string | string[];
    notes?: string;
}

export const ExerciseVideoSheet = ({
    exerciseName,
    videoUrl,
    trigger,
    description,
    instructions: propInstructions,
    notes
}: ExerciseVideoSheetProps) => {
    const { light } = useHapticFeedback();
    const [open, setOpen] = useState(false);

    // BUILD 55: Buscar instruções diretamente do banco de dados
    const { instructions: dbInstructions } = useExerciseVideo(exerciseName);

    const handleOpen = () => {
        light();
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    // BUILD 55: Use instruções do banco (prioridade) ou props (fallback)
    const getInstructionsText = (): string => {
        if (dbInstructions && typeof dbInstructions === 'string' && dbInstructions.trim().length > 0) {
            return dbInstructions;
        }

        if (!propInstructions) return '';

        if (Array.isArray(propInstructions)) {
            return propInstructions.join('\n');
        }

        if (typeof propInstructions === 'string') {
            const trimmed = propInstructions.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        return parsed.join('\n');
                    }
                    return trimmed;
                } catch {
                    return trimmed;
                }
            }
            return propInstructions;
        }

        return '';
    };

    const hasDescription = description && typeof description === 'string' && !/^\d+$/.test(description.trim());
    const instructionsText = getInstructionsText();
    const hasInstructions = instructionsText && instructionsText.trim().length > 0 && !/^\d+$/.test(instructionsText.trim());
    const hasNotes = notes && typeof notes === 'string' && notes.trim().length > 0;
    const hasExtraContent = hasDescription || hasInstructions || hasNotes;

    // Process instructions formatting (***bold***)
    const processInstructions = (text: string) => {
        return text.split('\n').map((line, idx) => {
            const processedLine = line.replace(
                /\*\*\*(.+?)\*\*\*/g,
                '<strong class="text-white font-semibold">$1</strong>'
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
        <>
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

            {/* BUILD 56: Fullscreen Modal (matching WorkoutDetail style) */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/95 z-[60] flex flex-col animate-fade-in"
                    onClick={handleClose}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm pt-safe">
                        <h3 className="text-white font-semibold text-lg truncate flex-1 pr-4">
                            {exerciseName}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            aria-label="Fechar"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="flex-1 overflow-y-auto pb-safe"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Video */}
                        <div className="p-4">
                            <div className="w-full max-w-2xl mx-auto animate-scale-in">
                                <VideoPlayer
                                    exerciseName={exerciseName}
                                    videoUrl={videoUrl}
                                    className="w-full aspect-video rounded-xl overflow-hidden"
                                />
                            </div>
                        </div>

                        {/* Instruções */}
                        {hasInstructions && (
                            <div className="px-4 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4 text-teal-400" />
                                    <h4 className="text-sm font-semibold text-white">
                                        Instruções
                                    </h4>
                                </div>
                                <div className="text-sm text-gray-300 leading-relaxed pl-6">
                                    {processInstructions(instructionsText)}
                                </div>
                            </div>
                        )}

                        {/* Descrição */}
                        {hasDescription && (
                            <div className="px-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-blue-400" />
                                    <h4 className="text-sm font-semibold text-white">
                                        Descrição
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed pl-6">
                                    {description}
                                </p>
                            </div>
                        )}

                        {/* Observações */}
                        {hasNotes && (
                            <div className="px-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4 text-amber-400" />
                                    <h4 className="text-sm font-semibold text-white">
                                        Observações
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line pl-6">
                                    {notes}
                                </p>
                            </div>
                        )}

                        {/* Mensagem se não houver conteúdo extra */}
                        {!hasExtraContent && (
                            <p className="text-sm text-gray-400 text-center py-4 px-4">
                                Assista ao vídeo demonstrativo para executar o exercício corretamente.
                            </p>
                        )}

                        {/* Botão de confirmação */}
                        <div className="px-4 py-6">
                            <button
                                onClick={handleClose}
                                className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
                            >
                                Ok, entendi!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExerciseVideoSheet;
