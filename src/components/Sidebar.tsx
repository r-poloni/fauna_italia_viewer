import React, { useState, useMemo } from 'react';
import { SpeciesData, RETAINED_COLUMNS, DISTRIBUTION_COLUMNS } from '../types';
import { Search } from 'lucide-react';

interface SidebarProps {
  data: SpeciesData[];
  selectedColumns: string[];
  onColumnToggle: (col: string) => void;
  filters: Record<string, string>;
  onFilterChange: (col: string, value: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  data, 
  selectedColumns, 
  onColumnToggle, 
  filters, 
  onFilterChange 
}) => {
  const [activeSearchCol, setActiveSearchCol] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const sidebarColumns = useMemo(() => {
    return RETAINED_COLUMNS.filter(col => !DISTRIBUTION_COLUMNS.includes(col));
  }, []);

  const getSuggestions = (col: string, value: string) => {
    if (!value) return [];
    const uniqueValues = Array.from(new Set(data.map(row => String(row[col] || ''))))
      .filter(v => (v as string).toLowerCase().includes((value as string).toLowerCase()))
      .slice(0, 5);
    return uniqueValues;
  };

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-zinc-200 h-full overflow-y-auto p-6 space-y-8">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Columns</h3>
        <div className="space-y-2">
          {sidebarColumns.map(col => (
            <label key={col} className="flex items-center gap-3 group cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                checked={selectedColumns.includes(col)}
                onChange={() => onColumnToggle(col)}
              />
              <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">{col}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Filters</h3>
        <div className="space-y-4">
          {sidebarColumns.map(col => (
            <div key={`filter-sidebar-${col}`} className="space-y-1 relative">
              <label className="text-xs font-medium text-zinc-500 uppercase">{col}</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder={`Filter ${col}...`}
                  value={filters[col] || ''}
                  onChange={(e) => {
                    onFilterChange(col, e.target.value);
                    setSuggestions(getSuggestions(col, e.target.value));
                    setActiveSearchCol(col);
                  }}
                  onFocus={() => {
                    setSuggestions(getSuggestions(col, filters[col] || ''));
                    setActiveSearchCol(col);
                  }}
                  onBlur={() => setTimeout(() => setActiveSearchCol(null), 200)}
                />
                {activeSearchCol === col && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                        onClick={() => onFilterChange(col, s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
