'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole, GradeSlug } from '@/types';
import { GRADE_ORDER } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface UserContextValue {
    role: UserRole;
    fullName: string;
    gradeSlug: GradeSlug;
    gradeId: string;
    gradeName: string;
    gradeOrder: number;      // 1=aprendiz, 2=compañero, 3=maestro
    isAdmin: boolean;
    userId: string | null;
    /** Devuelve true si el usuario puede ver contenido del grado indicado */
    canSeeGrade: (slug: GradeSlug) => boolean;
    setUser: (opts: { role: UserRole; name?: string; gradeSlug?: GradeSlug; gradeId?: string; gradeName?: string }) => void;
}

const GRADE_NAMES: Record<GradeSlug, string> = {
    aprendiz: 'Aprendiz',
    companero: 'Compañero',
    maestro: 'Maestro',
};
const GRADE_IDS: Record<GradeSlug, string> = {
    aprendiz: 'grade-1',
    companero: 'grade-2',
    maestro: 'grade-3',
};

const defaultCtx: UserContextValue = {
    role: 'student',
    fullName: '',
    gradeSlug: 'aprendiz',
    gradeId: 'grade-1',
    gradeName: 'Aprendiz',
    gradeOrder: 1,
    isAdmin: false,
    userId: null,
    canSeeGrade: () => false,
    setUser: () => { },
};

const UserContext = createContext<UserContextValue>(defaultCtx);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>('student');
    const [fullName, setFullName] = useState('');
    const [gradeSlug, setGradeSlug] = useState<GradeSlug>('aprendiz');
    const [userId, setUserId] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        async function loadProfile(user: any) {
            if (!user) {
                setRole('student');
                setFullName('');
                setGradeSlug('aprendiz');
                setUserId(null);
                setInitializing(false);
                return;
            }

            console.log("UserContext sync - Auth User:", user.email);

            // Try DB Profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, full_name, grades(slug)')
                .eq('id', user.id)
                .single();

            if (profile) {
                console.log("UserContext sync - Profile found in DB:", profile);
                const gradeData = profile.grades;
                const g = (Array.isArray(gradeData) ? gradeData[0]?.slug : (gradeData as any)?.slug) as GradeSlug;

                setRole(profile.role as UserRole);
                setFullName(profile.full_name || user.email || '');
                setGradeSlug(g || 'aprendiz');
                setUserId(user.id);

                localStorage.removeItem('mock_role');
                localStorage.removeItem('mock_name');
                localStorage.removeItem('mock_grade');
            } else {
                // Fallback to Metadata
                const meta = user.user_metadata;
                console.log("UserContext sync - DB Profile missing or RLS error. Fallback to Meta:", meta);
                if (meta && meta.role) {
                    setRole(meta.role as UserRole);
                    setFullName(meta.full_name || user.email || '');
                    setGradeSlug((meta.grade_slug as GradeSlug) || 'aprendiz');
                    setUserId(user.id);
                } else {
                    // Si no hay nada, intentar Mock
                    const r = localStorage.getItem('mock_role') as UserRole | null;
                    if (r) {
                        setRole(r);
                        setFullName(localStorage.getItem('mock_name') || '');
                        setGradeSlug((localStorage.getItem('mock_grade') as GradeSlug) || 'aprendiz');
                    }
                }
            }
            setInitializing(false);
        }

        // 1. Initial Load
        supabase.auth.getUser().then(({ data: { user } }) => loadProfile(user));

        // 2. Listen to changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth State Change:", event);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                loadProfile(session?.user);
            } else if (event === 'SIGNED_OUT') {
                loadProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setUser: UserContextValue['setUser'] = ({ role: newRole, name, gradeSlug: newGrade }) => {
        setRole(newRole);
        localStorage.setItem('mock_role', newRole);
        if (name) { setFullName(name); localStorage.setItem('mock_name', name); }
        if (newGrade) { setGradeSlug(newGrade); localStorage.setItem('mock_grade', newGrade); }
    };

    const isAdmin = role === 'admin';
    const gradeOrder = GRADE_ORDER[gradeSlug];
    const canSeeGrade = (slug: GradeSlug) => {
        if (isAdmin) return true; // Admins ven TODO
        return GRADE_ORDER[slug] <= gradeOrder;
    };

    return (
        <UserContext.Provider value={{
            role,
            fullName,
            gradeSlug,
            gradeId: GRADE_IDS[gradeSlug],
            gradeName: GRADE_NAMES[gradeSlug],
            gradeOrder,
            isAdmin: role === 'admin',
            userId,
            canSeeGrade,
            setUser,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
