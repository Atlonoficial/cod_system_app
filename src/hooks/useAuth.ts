import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, UserProfile } from '@/lib/supabase';
import { bootManager } from '@/lib/bootManager';
import { logger } from '@/lib/logger';

let authStateChangeCount = 0;

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs to track current state without triggering re-renders
  const userRef = useRef<User | null>(null);
  const profileRef = useRef<UserProfile | null>(null);
  const initRef = useRef(false);
  const fetchingProfileRef = useRef(false);

  useEffect(() => {
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    let unsubscribe: (() => void) | null = null;
    let safetyTimer: NodeJS.Timeout | null = null;

    // ✅ Safety timeout (8s) - Starts IMMEDIATELY to prevent deadlocks
    safetyTimer = setTimeout(() => {
      if (loading) {
        logger.warn('useAuth', '⏰ Safety timeout (8s), forcing ready');
        setLoading(false);
      }
    }, 8000);

    const handleAuthChange = async (newUser: User | null, newSession: Session | null) => {
      // Prevent redundant updates
      if (newUser?.id === userRef.current?.id && !!newUser === !!userRef.current) {
        // Session refresh, just update session but don't re-fetch profile
        if (newSession?.access_token !== session?.access_token) {
          setSession(newSession);
        }
        // Even if redundant, we must ensure loading is false
        if (safetyTimer) clearTimeout(safetyTimer);
        setLoading(false);
        return;
      }

      authStateChangeCount++;
      logger.info('useAuth', `🔔 AUTH STATE CHANGE #${authStateChangeCount}`, {
        userId: newUser?.id || 'null',
        timestamp: Date.now()
      });

      userRef.current = newUser;
      setUser(newUser);
      setSession(newSession);

      if (newUser) {
        // Only fetch profile if we don't have it or it's for a different user
        if (!profileRef.current || profileRef.current.id !== newUser.id) {
          if (fetchingProfileRef.current) return;
          fetchingProfileRef.current = true;

          try {
            logger.info('useAuth', '📋 Fetching profile for:', newUser.id);

            // Race condition protection: Timeout for profile fetch
            const profilePromise = getUserProfile(newUser.id);
            const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 6000));

            const profile = await Promise.race([profilePromise, timeoutPromise]);

            if (profile) {
              // ✅ MERGE: Garantir que dados críticos do metadata (como aceite de termos) 
              // tenham precedência se faltarem no banco (devido a erro de schema)
              const mergedProfile = {
                ...profile,
                terms_accepted_at: profile.terms_accepted_at || newUser.user_metadata?.terms_accepted_at,
                privacy_accepted_at: profile.privacy_accepted_at || newUser.user_metadata?.privacy_accepted_at
              };

              profileRef.current = mergedProfile;
              setUserProfile(mergedProfile);
              logger.info('useAuth', '✅ Profile loaded (with metadata merge)');
            } else {
              // Fallback profile
              const fallback: any = {
                id: newUser.id,
                email: newUser.email || '',
                name: newUser.user_metadata?.name || 'Usuário',
                user_type: newUser.user_metadata?.user_type || 'student',
                profile_complete: false,
                // Tenta pegar terms do metadata se existir
                terms_accepted_at: newUser.user_metadata?.terms_accepted_at,
                privacy_accepted_at: newUser.user_metadata?.privacy_accepted_at
              };
              profileRef.current = fallback;
              setUserProfile(fallback);
              logger.warn('useAuth', '⚠️ Using fallback profile (Fetch failed or timed out)');
            }
          } catch (error) {
            logger.error('useAuth', '❌ Profile fetch error', error);
          } finally {
            fetchingProfileRef.current = false;
            if (safetyTimer) clearTimeout(safetyTimer);
            setLoading(false);
          }
        } else {
          if (safetyTimer) clearTimeout(safetyTimer);
          setLoading(false);
        }
      } else {
        profileRef.current = null;
        setUserProfile(null);
        if (safetyTimer) clearTimeout(safetyTimer);
        setLoading(false);
      }
    };

    (async () => {
      try {
        await bootManager.waitForBoot(2000);

        // Initial check
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        await handleAuthChange(initialSession?.user ?? null, initialSession);

        // Subscribe to changes
        const { data: { subscription } } = onAuthStateChange((u, s) => {
          handleAuthChange(u, s);
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (error) {
        logger.error('useAuth', 'Setup error', error);
        setLoading(false);
      }
    })();

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    userProfile,
    loading,
    isAuthenticated: !!user,
    isStudent: userProfile?.user_type === 'student',
    isTeacher: userProfile?.user_type === 'teacher',
    refreshProfile: async () => {
      if (userRef.current) {
        fetchingProfileRef.current = true;
        const profile = await getUserProfile(userRef.current.id);
        if (profile) {
          // ✅ MERGE: Aplicar mesma lógica de merge do handleAuthChange
          const mergedProfile = {
            ...profile,
            terms_accepted_at: profile.terms_accepted_at || userRef.current.user_metadata?.terms_accepted_at,
            privacy_accepted_at: profile.privacy_accepted_at || userRef.current.user_metadata?.privacy_accepted_at
          };

          profileRef.current = mergedProfile;
          setUserProfile(mergedProfile);
          logger.info('useAuth', '✅ Profile refreshed (with metadata merge)');
        }
        fetchingProfileRef.current = false;
      }
    }
  };
};
