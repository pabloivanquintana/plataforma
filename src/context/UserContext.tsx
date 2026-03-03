'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserRole, GradeSlug } from '@/types';
import { GRADE_ORDER } from '@/types';

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

    useEffect(() => {
        const r = localStorage.getItem('mock_role') as UserRole | null;
        const n = localStorage.getItem('mock_name');
        const g = localStorage.getItem('mock_grade') as GradeSlug | null;
        if (r) setRole(r);
        if (n) setFullName(n);
        if (g) setGradeSlug(g);
    }, []);

    const setUser: UserContextValue['setUser'] = ({ role: newRole, name, gradeSlug: newGrade }) => {
        setRole(newRole);
        localStorage.setItem('mock_role', newRole);
        if (name) { setFullName(name); localStorage.setItem('mock_name', name); }
        if (newGrade) { setGradeSlug(newGrade); localStorage.setItem('mock_grade', newGrade); }
    };

    const gradeOrder = GRADE_ORDER[gradeSlug];
    const canSeeGrade = (slug: GradeSlug) => GRADE_ORDER[slug] <= gradeOrder;

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
