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
    canSeeGrade: () => false,
    setUser: () => { },
};

const UserContext = createContext<UserContextValue>(defaultCtx);

export function UserProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<UserRole>('student');
    const [fullName, setFullName] = useState('');
    const [gradeSlug, setGradeSlug] = useState<GradeSlug>('aprendiz');
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        async function syncSession() {
            const supabase = createClient();

            // 1. Verificar si hay sesión real en Supabase
            const { data: { user } } = await supabase.auth.getUser();
            console.log("UserContext sync - Auth User:", user?.email);

            if (user) {
                // Fetch profile
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, full_name, grades(slug)')
                    .eq('id', user.id)
                    .single();

                console.log("UserContext sync - Profile Data:", profile);
                if (error) console.error("UserContext sync - Profile Error:", error);

                if (profile) {
                    // Supabase joins can return an array or a single object depending on config
                    const gradeData = profile.grades;
                    const g = (Array.isArray(gradeData) ? gradeData[0]?.slug : (gradeData as any)?.slug) as GradeSlug;

                    setRole(profile.role as UserRole);
                    setFullName(profile.full_name || user.email || '');
                    setGradeSlug(g || 'aprendiz');

                    // Clear mock data if a real session is found
                    localStorage.removeItem('mock_role');
                    localStorage.removeItem('mock_name');
                    localStorage.removeItem('mock_grade');
                    setInitializing(false);
                    return;
                } else {
                    // FALLBACK: Si no hay perfil en la tabla, intentar usar metadata de Auth
                    const meta = user.user_metadata;
                    if (meta && meta.role) {
                        console.log("UserContext - Falling back to Auth Metadata:", meta);
                        setRole(meta.role as UserRole);
                        setFullName(meta.full_name || user.email || '');
                        setGradeSlug((meta.grade_slug as GradeSlug) || 'aprendiz');
                        setInitializing(false);
                        return;
                    }
                }
            }

            // 2. Si no hay sesión real, intentar recuperar del Mock/LocalStorage
            const r = localStorage.getItem('mock_role') as UserRole | null;
            const n = localStorage.getItem('mock_name');
            const g = localStorage.getItem('mock_grade') as GradeSlug | null;

            if (r) setRole(r);
            if (n) setFullName(n);
            if (g) setGradeSlug(g);
            setInitializing(false);
        }

        syncSession();
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
