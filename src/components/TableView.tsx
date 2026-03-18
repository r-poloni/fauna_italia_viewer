import React, { useMemo, useState } from 'react';
import { SpeciesData, RETAINED_COLUMNS } from '../types';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';

interface TableViewProps {
  data: SpeciesData[];
}

export const TableView: React.FC<TableViewProps> = ({ data }) => {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        const val = value as string;
        if (!val) return true;
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(val.toLowerCase());
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    if (sortConfig.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const { key, direction } of sortConfig) {
        const valA = String(a[key] || '');
        const valB = String(b[key] || '');
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const toggleSort = (key: string, shiftKey: boolean) => {
    setSortConfig(prev => {
      const existing = prev.find(s => s.key === key);
      let next;
      if (existing) {
        if (existing.direction === 'asc') {
          next = { key, direction: 'desc' as const };
        } else {
          next = null;
        }
      } else {
        next = { key, direction: 'asc' as const };
      }

      if (shiftKey) {
        if (!next) return prev.filter(s => s.key !== key);
        const filtered = prev.filter(s => s.key !== key);
        return [...filtered, next];
      } else {
        return next ? [next] : [];
      }
    });
  };

  const exportToCSV = () => {
    const headers = RETAINED_COLUMNS.join(',');
    const rows = sortedData.map(row => 
      RETAINED_COLUMNS.map(col => {
        const val = row[col] || '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'species_filtered_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-zinc-500">
          Showing <span className="font-semibold text-zinc-900">{sortedData.length}</span> species
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            {RETAINED_COLUMNS.map(col => (
              <th 
                key={col} 
                className="p-3 text-xs font-semibold text-zinc-600 uppercase tracking-wider cursor-pointer hover:bg-zinc-100 transition-colors"
                onClick={(e) => toggleSort(col, e.shiftKey)}
              >
                <div className="flex items-center gap-2">
                  {col}
                  <div className="flex flex-col">
                    {sortConfig.find(s => s.key === col)?.direction === 'asc' && <ChevronUp size={12} />}
                    {sortConfig.find(s => s.key === col)?.direction === 'desc' && <ChevronDown size={12} />}
                  </div>
                </div>
              </th>
            ))}
          </tr>
          <tr className="bg-white border-b border-zinc-200">
            {RETAINED_COLUMNS.map(col => (
              <th key={`filter-${col}`} className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <input
                    type="text"
                    className="w-full pl-8 pr-2 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Filter..."
                    value={filters[col] || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, [col]: e.target.value }))}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {sortedData.map((row, i) => (
            <tr key={i} className="hover:bg-zinc-50 transition-colors">
              {RETAINED_COLUMNS.map(col => (
                <td key={col} className="p-3 text-sm text-zinc-700 whitespace-nowrap">
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {sortedData.length === 0 && (
        <div className="p-8 text-center text-zinc-500 italic">
          No data found matching the filters.
        </div>
      )}
    </div>
    </div>
  );
};
