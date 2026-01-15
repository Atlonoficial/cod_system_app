import { useEffect, useState } from 'react';
import { useAuthContext } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { MembershipBlockedScreen } from './MembershipBlockedScreen';
import { MembershipExpiredScreen } from './MembershipExpiredScreen';
import { Loader2 } from 'lucide-react';

interface MembershipGateProps {
    children: React.ReactNode;
}

export const MembershipGate = ({ children }: MembershipGateProps) => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
    const [membershipExpiry, setMembershipExpiry] = useState<string | null>(null);
    const [teacherPhone, setTeacherPhone] = useState<string | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        const checkMembership = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                // Buscar student record
                const { data: student, error } = await supabase
                    .from('students')
                    .select('id, membership_status, membership_expiry, teacher_id')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('[MembershipGate] Error fetching student:', error);
                    setLoading(false);
                    return;
                }

                if (!student) {
                    console.warn('[MembershipGate] No student record found for user:', user.id);
                    setLoading(false);
                    return;
                }

                setStudentId(student.id);
                setMembershipStatus(student.membership_status);
                setMembershipExpiry(student.membership_expiry);

                // Buscar telefone do professor
                if (student.teacher_id) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('phone')
                        .eq('id', student.teacher_id)
                        .single();

                    if (profile?.phone) {
                        setTeacherPhone(profile.phone);
                    }
                }
            } catch (err) {
                console.error('[MembershipGate] Exception:', err);
            } finally {
                setLoading(false);
            }
        };

        checkMembership();

        // Realtime subscription para mudanças no membership
        const channel = supabase
            .channel('membership_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'students',
                    filter: `user_id=eq.${user?.id}`
                },
                (payload) => {
                    console.log('[MembershipGate] Student updated:', payload.new);
                    const newStudent = payload.new as any;
                    setMembershipStatus(newStudent.membership_status);
                    setMembershipExpiry(newStudent.membership_expiry);
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // BLOQUEIO TOTAL - nunca pagou ou cancelado
    if (!membershipStatus || membershipStatus === 'pending' || membershipStatus === 'cancelled') {
        return <MembershipBlockedScreen teacherPhone={teacherPhone} />;
    }

    // GATE RENOVAÇÃO - expirado ou vencido
    if (membershipStatus === 'expired' || (membershipExpiry && new Date(membershipExpiry) < new Date())) {
        return (
            <MembershipExpiredScreen
                expiryDate={membershipExpiry}
                teacherPhone={teacherPhone}
                studentId={studentId}
                onRenewed={() => {
                    // Forçar reload do componente para re-checar status
                    setLoading(true);
                    setTimeout(() => window.location.reload(), 1000);
                }}
            />
        );
    }

    // LIBERADO - ativo e dentro da validade
    return <>{children}</>;
};
