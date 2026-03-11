'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pageNum: number;
        if (totalPages <= 5) {
          pageNum = i + 1;
        } else if (page <= 3) {
          pageNum = i + 1;
        } else if (page >= totalPages - 2) {
          pageNum = totalPages - 4 + i;
        } else {
          pageNum = page - 2 + i;
        }

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
              pageNum === page
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
