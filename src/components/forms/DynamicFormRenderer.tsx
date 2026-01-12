import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface Question {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox_group' | 'radio_group' | 'number';
    label: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
}

interface DynamicFormRendererProps {
    questions: Question[];
    onSubmit: (answers: Record<string, any>) => void;
    loading?: boolean;
}

export const DynamicFormRenderer = ({ questions, onSubmit, loading }: DynamicFormRendererProps) => {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (id: string, value: any) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
        // Clear error if exists
        if (errors[id]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const handleCheckboxGroup = (questionId: string, option: string, checked: boolean) => {
        const currentValues = (answers[questionId] as string[]) || [];
        let newValues;
        if (checked) {
            newValues = [...currentValues, option];
        } else {
            newValues = currentValues.filter(v => v !== option);
        }
        handleChange(questionId, newValues);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        questions.forEach(q => {
            if (q.required) {
                const val = answers[q.id];
                if (
                    val === undefined ||
                    val === null ||
                    val === '' ||
                    (Array.isArray(val) && val.length === 0)
                ) {
                    newErrors[q.id] = 'Este campo é obrigatório';
                    isValid = false;
                }
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(answers);
        } else {
            // Scroll to first error
            const firstErrorId = Object.keys(errors)[0];
            const firstError = document.getElementById(`question-${firstErrorId}`);
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="space-y-6">
            {questions.map((q) => (
                <div key={q.id} id={`question-${q.id}`} className="space-y-3 bg-card/50 p-4 rounded-xl border border-border/50">
                    <Label className="text-base font-medium">
                        {q.label} {q.required && <span className="text-destructive">*</span>}
                    </Label>

                    {q.type === 'text' && (
                        <Input
                            value={answers[q.id] || ''}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            placeholder={q.placeholder}
                        />
                    )}

                    {q.type === 'number' && (
                        <Input
                            type="number"
                            value={answers[q.id] || ''}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            placeholder={q.placeholder}
                        />
                    )}

                    {q.type === 'textarea' && (
                        <Textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            placeholder={q.placeholder}
                        />
                    )}

                    {q.type === 'select' && (
                        <Select
                            value={answers[q.id] || ''}
                            onValueChange={(val) => handleChange(q.id, val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {q.options?.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {q.type === 'radio_group' && (
                        <RadioGroup
                            value={answers[q.id] || ''}
                            onValueChange={(val) => handleChange(q.id, val)}
                            className="space-y-2"
                        >
                            {q.options?.map(opt => (
                                <div key={opt} className="flex items-center space-x-2">
                                    <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                                    <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {q.type === 'checkbox_group' && (
                        <div className="space-y-2">
                            {q.options?.map(opt => (
                                <div key={opt} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${q.id}-${opt}`}
                                        checked={(answers[q.id] || []).includes(opt)}
                                        onCheckedChange={(checked) => handleCheckboxGroup(q.id, opt, checked as boolean)}
                                    />
                                    <Label htmlFor={`${q.id}-${opt}`} className="font-normal">{opt}</Label>
                                </div>
                            ))}
                        </div>
                    )}

                    {errors[q.id] && (
                        <p className="text-sm text-destructive">{errors[q.id]}</p>
                    )}
                </div>
            ))}

            {/* Botão de envio - não fixo para evitar ser cortado pelo teclado ou SafeArea */}
            <div className="pt-6 pb-safe-2xl">
                <Button
                    className="w-full h-12 rounded-full text-lg font-medium shadow-lg shadow-primary/20"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Enviar Respostas'}
                </Button>
            </div>
        </div>
    );
};
