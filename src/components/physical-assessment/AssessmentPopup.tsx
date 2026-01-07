import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { ClipboardList, Send, Loader2, CheckCircle } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export function AssessmentPopup() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [open, setOpen] = useState(false)
    const [request, setRequest] = useState<any>(null)
    const [evaluation, setEvaluation] = useState<any>(null)
    const [template, setTemplate] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro')
    const [currentQIndex, setCurrentQIndex] = useState(0)

    useEffect(() => {
        if (user?.id) checkPendingRequests()
    }, [user?.id])

    const checkPendingRequests = async () => {
        // Fetch pending assessment requests
        const { data } = await supabase.from('student_requests' as any)
            .select('*')
            .eq('student_id', user?.id)
            .eq('status', 'pending')
            .eq('type', 'assessment')
            .limit(1)
            .maybeSingle()

        if (data) {
            setRequest(data)
            setOpen(true)
            loadEvaluationData(data.metadata?.evaluation_id)
        }
    }

    const loadEvaluationData = async (evalId: string) => {
        if (!evalId) return
        setLoading(true)
        const { data: evalData } = await supabase.from('evaluations').select('*, template:evaluation_templates(*)').eq('id', evalId).single()
        if (evalData) {
            setEvaluation(evalData)
            setTemplate(evalData.template)
        }
        setLoading(false)
    }

    const handleAnswerChange = (qId: string, val: any, type: string) => {
        setAnswers(prev => ({ ...prev, [qId]: { value: val, type } }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // 1. Save Responses
            const questions = template?.questions || []
            if (questions.length === 0) throw new Error("Sem perguntas para salvar")

            const responsesToSave = questions.map((q: any) => ({
                evaluation_id: evaluation.id,
                question_id: q.id,
                question_text: q.question,
                response_type: q.type,
                response_value: answers[q.id]?.value
            }))

            const { error: respError } = await supabase.from('evaluation_responses').insert(responsesToSave)
            if (respError) throw respError

            // 2. Update Evaluation Status
            await supabase.from('evaluations').update({ status: 'completed' }).eq('id', evaluation.id)

            // 3. Update Request Status
            await supabase.from('student_requests' as any).update({ status: 'completed' }).eq('id', request.id)

            setStep('success')
            setTimeout(() => {
                setOpen(false)
                setStep('intro')
                setRequest(null)
            }, 3000)
        } catch (e: any) {
            console.error(e)
            toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Render Questions
    const renderQuestion = (q: any) => {
        const val = answers[q.id]?.value

        switch (q.type) {
            case 'text':
                return <Input value={val || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)} placeholder="Sua resposta" />
            case 'textarea':
                return <Textarea value={val || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)} placeholder="Descreva..." />
            case 'scale':
                return (
                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>1 (Péssimo)</span>
                            <span>10 (Excelente)</span>
                        </div>
                        <Slider
                            value={[Number(val) || 5]}
                            onValueChange={(v) => handleAnswerChange(q.id, v[0], q.type)}
                            min={1} max={10} step={1}
                        />
                        <div className="text-center font-bold text-xl">{val || 5}</div>
                    </div>
                )
            case 'select':
                return (
                    <Select value={val} onValueChange={(v) => handleAnswerChange(q.id, v, q.type)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {q.options?.map((opt: string) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )
            case 'multiselect':
                // Simple implementation for multiselect
                return (
                    <div className="space-y-2">
                        {q.options?.map((opt: string) => {
                            const current = (val || []) as string[]
                            const isSelected = current.includes(opt)
                            return (
                                <div key={opt} className="flex items-center space-x-2">
                                    <Switch checked={isSelected} onCheckedChange={(checked) => {
                                        const newVal = checked ? [...current, opt] : current.filter(x => x !== opt)
                                        handleAnswerChange(q.id, newVal, q.type)
                                    }} />
                                    <Label>{opt}</Label>
                                </div>
                            )
                        })}
                    </div>
                )
            default:
                return <Input value={val || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')} />
        }
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && step !== 'success') setOpen(false) }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5" />
                        {step === 'success' ? 'Enviado!' : (request ? request.title : 'Avaliação Pendente')}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'intro' && 'Seu treinador solicitou que você preencha esta avaliação.'}
                        {step === 'form' && 'Responda as perguntas abaixo com atenção.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'intro' && (
                        <div className="text-center space-y-4">
                            <p>{request?.description || "Uma nova avaliação para acompanhar seu progresso."}</p>
                            <Button className="w-full" onClick={() => setStep('form')} disabled={loading || !template}>
                                {loading ? <Loader2 className="animate-spin" /> : "Responder Agora"}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Lembrar Depois</Button>
                        </div>
                    )}

                    {step === 'form' && template && (
                        <div className="space-y-6">
                            {template.questions?.map((q: any, i: number) => (
                                <div key={q.id} className="space-y-2 pb-4 border-b last:border-0">
                                    <Label className="text-base font-medium">
                                        {i + 1}. {q.question}
                                        {q.required && <span className="text-destructive ml-1">*</span>}
                                    </Label>
                                    {renderQuestion(q)}
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                            <h3 className="text-xl font-bold">Respostas Enviadas</h3>
                            <p className="text-muted-foreground">Obrigado por completar sua avaliação!</p>
                        </div>
                    )}
                </div>

                {step === 'form' && (
                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Enviar Respostas"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
