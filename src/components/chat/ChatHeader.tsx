import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionIndicator } from './ConnectionIndicator';
import { ConnectionStatus } from '@/hooks/useConnectionStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  student_id?: string;
  teacher_id?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count_student?: number;
  unread_count_teacher?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ChatHeaderProps {
  conversation?: Conversation | null;
  onlineUsers: string[];
  typingUsers: string[];
  connectionStatus: ConnectionStatus;
  isReconnecting?: boolean;
}

export const ChatHeader = ({
  conversation,
  onlineUsers,
  typingUsers,
  connectionStatus,
  isReconnecting = false
}: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [teacherName, setTeacherName] = useState<string>('Professor');
  const [teacherAvatar, setTeacherAvatar] = useState<string | null>(null);

  // Sempre mostrar o professor no chat
  const chatPartner = teacherName;
  const chatPartnerId = conversation?.teacher_id;

  // Buscar nome e avatar do professor
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!conversation?.teacher_id) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', conversation.teacher_id)
          .maybeSingle();

        if (data && !error) {
          setTeacherName(data.name || 'Professor');
          setTeacherAvatar(data.avatar_url);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do professor:', error);
      }
    };

    if (conversation?.teacher_id) {
      fetchTeacherData();
    }
  }, [conversation?.teacher_id]);

  const isOnline = chatPartnerId ? onlineUsers.includes(chatPartnerId) : false;
  const isTyping = chatPartnerId ? typingUsers.includes(chatPartnerId) : false;

  const getStatusText = () => {
    if (isTyping) return 'digitando...';
    if (isOnline) return 'online';
    return 'offline';
  };

  const getStatusColor = () => {
    if (isTyping) return 'text-primary';
    if (isOnline) return 'text-success';
    return 'text-muted-foreground';
  };

  const handleReport = () => {
    // Logic to report user
    const subject = `Denúncia de Usuário: ${chatPartner} (${chatPartnerId})`;
    const body = "Por favor, descreva o motivo da denúncia:\n\n";
    window.open(`mailto:suporte@[DOMAIN]?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);

    toast({
      title: "Denúncia Iniciada",
      description: "Seu cliente de email foi aberto para formalizar a denúncia.",
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        {/* Botão voltar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-foreground hover:bg-muted"
        >
          <ArrowLeft size={20} />
        </Button>

        {/* Avatar e info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={teacherAvatar || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {chatPartner.charAt(0)}
              </AvatarFallback>
            </Avatar>

            {/* Indicador online */}
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success border-2 border-card rounded-full" />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{chatPartner}</h3>
            <p className={`text-xs ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </div>
      </div>

      {/* Status do Professor e Conexão */}
      <div className="flex items-center gap-2">
        {/* Status da conexão */}
        {connectionStatus !== 'connected' && (
          <ConnectionIndicator
            status={connectionStatus}
            isReconnecting={isReconnecting}
            className="mr-2"
          />
        )}

        {connectionStatus === 'connected' && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isOnline
            ? 'border-success/30 bg-success/10 shadow-sm shadow-success/20'
            : 'border-border bg-muted/50'
            }`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success animate-pulse shadow-lg shadow-success/50' : 'bg-muted-foreground'
              }`} />
            <span className={`text-xs font-semibold ${isTyping ? 'text-primary' : isOnline ? 'text-success' : 'text-muted-foreground'
              }`}>
              {getStatusText()}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
              <Flag className="mr-2 h-4 w-4" />
              <span>Denunciar Conteúdo</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};