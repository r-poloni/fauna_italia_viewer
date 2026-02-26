import React, { useEffect, useState, useMemo } from 'react';
import { loadAndProcessData } from './services/dataService';
import { SpeciesData, RETAINED_COLUMNS } from './types';
import { TableView } from './components/TableView';
import { MapView } from './components/MapView';
import { Sidebar } from './components/Sidebar';
import { Table as TableIcon, Map as MapIcon, Filter, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [allData, setAllData] = useState<SpeciesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>(RETAINED_COLUMNS);

  useEffect(() => {
    loadAndProcessData().then(data => {
      setAllData(data);
      setLoading(false);
    });
  }, []);

  const filteredData = useMemo(() => {
    return allData.filter(row => {
      return Object.entries(filters).every(([key, value]) => {
        const val = value as string;
        if (!val) return true;
        const cellValue = String(row[key] || '').toLowerCase();
        return cellValue.includes(val.toLowerCase());
      });
    });
  }, [allData, filters]);

  const handleRegionClick = (regionCode: string) => {
    setFilters(prev => ({ ...prev, [regionCode]: 'y' }));
    setViewMode('table');
  };

  const handleFilterChange = (col: string, value: string) => {
    setFilters(prev => ({ ...prev, [col]: value }));
  };

  const handleColumnToggle = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-medium">Loading species data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
      {viewMode === 'map' && (
        <Sidebar 
          data={allData}
          selectedColumns={selectedColumns}
          onColumnToggle={handleColumnToggle}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Database className="text-indigo-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 leading-tight">Italian Species Distribution</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                {filteredData.length} Species Found
              </p>
            </div>
          </div>

          <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <TableIcon size={18} />
              Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'map' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <MapIcon size={18} />
              Map
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {viewMode === 'table' ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <TableView data={filteredData} />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex-1">
                  <MapView data={filteredData} onRegionClick={handleRegionClick} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
