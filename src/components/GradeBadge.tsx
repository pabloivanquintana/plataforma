'use client';

import { cn } from '@/lib/utils';
import type { GradeSlug } from '@/types';

const GRADE_BADGE_STYLES: Record<GradeSlug, string> = {
    aprendiz: 'border-stone-500/30 bg-stone-500/8 text-stone-400',
    companero: 'border-yellow-600/30 bg-yellow-500/8 text-yellow-500',
    maestro: 'border-purple-500/30 bg-purple-500/8 text-purple-400',
};

interface GradeBadgeProps {
    slug: GradeSlug;
    name: string;
    className?: string;
}

export default function GradeBadge({ slug, name, className }: GradeBadgeProps) {
    return (
        <span className={cn(
            'text-[9px] uppercase tracking-wider px-1.5 py-0.5 border flex-shrink-0',
            GRADE_BADGE_STYLES[slug] || 'border-white/10 text-slate-400',
            className
        )}>
            {name}
        </span>
    );
}
