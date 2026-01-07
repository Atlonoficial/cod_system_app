import { Bell, Camera, FileText, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StudentRequest } from '@/hooks/useStudentRequests';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RequestNotificationBannerProps {
    requests: StudentRequest[];
    type: 'exam' | 'photo';
    onActionClick?: () => void;
}

const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
        'blood': 'Exame de Sangue',
        'cardiology': 'Exame Cardiológico',
        'imaging': 'Exame de Imagem',
        'others': 'Outro Exame'
    };
    return category ? labels[category] || category : 'Exame Médico';
};

const getPhotoTypesLabel = (types?: string[]) => {
    if (!types || types.length === 0) return 'fotos de progresso';
    const labels: Record<string, string> = {
        'front': 'Frente',
        'back': 'Costas',
        'side_left': 'Lateral Esq.',
        'side_right': 'Lateral Dir.',
        'flexed': 'Flexionada'
    };
    return types.map(t => labels[t] || t).join(', ');
};

export const RequestNotificationBanner = ({ requests, type, onActionClick }: RequestNotificationBannerProps) => {
    if (requests.length === 0) return null;

    const latestRequest = requests[0];
    const Icon = type === 'exam' ? FileText : Camera;

    const getMessage = () => {
        if (type === 'exam') {
            const category = latestRequest.metadata?.exam_category;
            return `Seu treinador solicitou: ${getCategoryLabel(category)}`;
        } else {
            const photoTypes = latestRequest.metadata?.photo_types;
            return `Seu treinador solicitou fotos: ${getPhotoTypesLabel(photoTypes)}`;
        }
    };

    const getTimeAgo = () => {
        try {
            return formatDistanceToNow(new Date(latestRequest.created_at), {
                addSuffix: true,
                locale: ptBR
            });
        } catch {
            return '';
        }
    };

    return (
        <Card className="mb-4 bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30 overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">
                                Nova Solicitação
                            </span>
                            {requests.length > 1 && (
                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                    +{requests.length - 1}
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            {getMessage()}
                        </p>
                        {latestRequest.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {latestRequest.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            {getTimeAgo()}
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full mt-3"
                    size="sm"
                    onClick={onActionClick}
                >
                    <Icon className="w-4 h-4 mr-2" />
                    {type === 'exam' ? 'Enviar Exame' : 'Enviar Fotos'}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
            </CardContent>
        </Card>
    );
};
