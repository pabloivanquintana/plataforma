// Tipos globales de la aplicación

export type UserRole = 'student' | 'admin';
export type GradeSlug = 'aprendiz' | 'companero' | 'maestro';

// Orden jerárquico: aprendiz=1, companero=2, maestro=3
export const GRADE_ORDER: Record<GradeSlug, number> = {
    aprendiz: 1,
    companero: 2,
    maestro: 3,
};

export interface Grade {
    id: string;
    name: string;
    slug: GradeSlug;
    order: number;
}

export interface Profile {
    id: string;
    full_name: string | null;
    grade_id: string | null;
    role: UserRole;
    grade?: Grade;
}

/** Usuario gestionado desde el panel admin (modo demo / seed) */
export interface MockUser {
    id: string;
    full_name: string;
    email: string;
    password: string;   // solo demo — en prod se hashea en Supabase Auth
    role: UserRole;     // 'student' = Hermano, 'admin' = Vigilante
    grade_id: string;
    grade_slug: GradeSlug;
}

export type ResourceType = 'drive' | 'link' | 'pdf' | 'video' | 'audio';

export interface Resource {
    id: string;
    topic_id: string;
    title: string;
    description: string | null;
    type: ResourceType;
    url: string;
    order: number;
}

export interface Topic {
    id: string;
    grade_id: string;
    title: string;
    description: string | null;
    order: number;
    resources?: Resource[];
}

export type MediaType = 'video' | 'audio' | 'pdf' | 'link';

export interface MediaItem {
    id: string;
    grade_id: string;
    title: string;
    description: string | null;
    type: MediaType;
    url: string;
}

export type EventType = 'general' | 'ritual' | 'taller' | 'examen';

export interface CalendarEvent {
    id: string;
    grade_id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_type: EventType;
}

export interface Plancha {
    id: string;
    grade_id: string;
    topic_id?: string | null;
    title: string;
    author: string;
    date: string;
    description: string | null;
    tags: string[];
    resource_url: string;
    order_index: number;
    created_at?: string;
}
