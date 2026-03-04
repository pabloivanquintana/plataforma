'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-white/10 text-slate-400 hover:text-yellow-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={cn(
                            "w-8 h-8 text-xs font-semibold transition-all border",
                            currentPage === page
                                ? "gold-gradient text-black border-transparent"
                                : "border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-200"
                        )}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-white/10 text-slate-400 hover:text-yellow-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
