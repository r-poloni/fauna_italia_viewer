import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { SpeciesData, REGIONS_MAP, MACRO_REGIONS } from '../types';

interface MapViewProps {
  data: SpeciesData[];
  onRegionClick: (regionCode: string) => void;
}

// Mapping from TopoJSON region names to our internal codes
const TOPO_NAME_TO_CODE: Record<string, string> = {
  "Piemonte": "Pi",
  "Valle d'Aosta/Vallée d'Aoste": "Ao",
  "Lombardia": "Lo",
  "Trentino-Alto Adige/Südtirol": "VT",
  "Veneto": "V",
  "Friuli-Venezia Giulia": "FVG",
  "Liguria": "Li",
  "Emilia-Romagna": "ER",
  "Toscana": "To",
  "Umbria": "Um",
  "Marche": "Ma",
  "Lazio": "La",
  "Abruzzo": "Abr",
  "Molise": "Mo",
  "Campania": "Cp",
  "Puglia": "Pu",
  "Basilicata": "Bas",
  "Calabria": "Cal",
  "Sicilia": "Si",
  "Sardegna": "Sa"
};

export const MapView: React.FC<MapViewProps> = ({ data, onRegionClick }) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load TopoJSON data - Using a reliable source for official Italian limits
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/openpolis/geojson-italy/master/topojson/limits_IT_regions.topo.json')
      .then(res => res.json())
      .then(topology => {
        const geojson = topojson.feature(topology, topology.objects.regions);
        setGeoData(geojson);
      })
      .catch(err => console.error("Failed to load map data:", err));
  }, []);

  const hasAllRegionalData = useMemo(() => {
    if (data.length === 0) return false;
    const regionCodes = Object.keys(REGIONS_MAP);
    return data.every(row => regionCodes.some(code => row[code] && row[code].trim() !== ""));
  }, [data]);

  const stats = useMemo(() => {
    const regionStats: Record<string, number> = {};
    const macroStats: Record<string, number> = { N: 0, S: 0, Si: 0, Sa: 0 };

    if (hasAllRegionalData) {
      Object.keys(REGIONS_MAP).forEach(code => {
        regionStats[code] = data.filter(row => row[code] === 'y').length;
      });
    } else {
      ['N', 'S', 'Si', 'Sa'].forEach(code => {
        macroStats[code] = data.filter(row => row[code] === 'y').length;
      });
    }

    return { regionStats, macroStats };
  }, [data, hasAllRegionalData]);

  const getColor = (code: string) => {
    if (data.length === 0) return '#f8f9fa';
    
    if (data.length === 1) {
      const row = data[0];
      const val = hasAllRegionalData ? row[code] : (() => {
        const macro = Object.entries(MACRO_REGIONS).find(([m, codes]) => codes.includes(code))?.[0];
        return macro ? row[macro] : '';
      })();
      
      if (val === 'y') return '#86efac'; // soft green
      if (val === '?') return '#fef08a'; // soft yellow
      return '#f1f5f9'; // soft slate
    } else {
      const counts = hasAllRegionalData ? Object.values(stats.regionStats) : Object.values(stats.macroStats);
      const maxVal = Math.max(...(counts as number[]), 1);
      const minVal = Math.min(...(counts as number[]));

      const count = hasAllRegionalData 
        ? stats.regionStats[code] || 0
        : (() => {
            const macro = Object.entries(MACRO_REGIONS).find(([m, codes]) => codes.includes(code))?.[0];
            return macro ? stats.macroStats[macro] : 0;
          })();
      
      if (count === 0) return '#f1f5f9';

      const t = maxVal === minVal ? 1 : (count - minVal) / (maxVal - minVal);
      return d3.interpolateGreens(t * 0.7 + 0.2);
    }
  };

  // Render map using D3
  useEffect(() => {
    if (!geoData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 700;
    const height = 900;

    // Projection centered on Italy, adjusted to include Sardinia/Corsica properly
    const projection = d3.geoMercator()
      .center([12.5, 42])
      .scale(3200)
      .translate([width / 2, height / 2]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Draw Regions
    svg.append("g")
      .selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", (d: any) => pathGenerator(d))
      .attr("fill", (d: any) => {
        const code = TOPO_NAME_TO_CODE[d.properties.reg_name];
        return code ? getColor(code) : '#f8f9fa';
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("class", "transition-all duration-500 cursor-pointer hover:opacity-80")
      .on("click", (event, d: any) => {
        const code = TOPO_NAME_TO_CODE[d.properties.reg_name];
        if (code) onRegionClick(code);
      })
      .on("mouseenter", (event, d: any) => {
        const code = TOPO_NAME_TO_CODE[d.properties.reg_name];
        if (code) setHoveredRegion(code);
      })
      .on("mouseleave", () => setHoveredRegion(null));

    // Add Corsica (Integrated geographically above Sardinia)
    const corsicaData = {
      type: "Feature",
      properties: { reg_name: "Corsica", code: "Cor" },
      geometry: {
        type: "Polygon",
        coordinates: [[[8.5, 43.0], [9.5, 43.0], [9.6, 42.6], [9.5, 42.0], [9.2, 41.3], [8.8, 41.4], [8.5, 42.0], [8.4, 42.6], [8.5, 43.0]]]
      }
    };

    svg.append("path")
      .datum(corsicaData)
      .attr("d", pathGenerator as any)
      .attr("fill", getColor('Cor'))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("class", "transition-all duration-500 cursor-pointer hover:opacity-80")
      .on("click", () => onRegionClick('Cor'))
      .on("mouseenter", () => setHoveredRegion('Cor'))
      .on("mouseleave", () => setHoveredRegion(null));

    // Add Micro-states (San Marino and Vatican City)
    const microStates = [
      { name: "San Marino", code: "RSM", lat: 43.93, lon: 12.45 },
      { name: "Vatican City", code: "CV", lat: 41.90, lon: 12.45 }
    ];

    svg.selectAll(".micro-state")
      .data(microStates)
      .join("circle")
      .attr("class", "micro-state transition-all duration-500 cursor-pointer hover:opacity-80")
      .attr("cx", d => projection([d.lon, d.lat])![0])
      .attr("cy", d => projection([d.lon, d.lat])![1])
      .attr("r", 4)
      .attr("fill", d => getColor(d.code))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("click", (event, d) => onRegionClick(d.code))
      .on("mouseenter", (event, d) => setHoveredRegion(d.code))
      .on("mouseleave", () => setHoveredRegion(null));

  }, [geoData, data, stats, hasAllRegionalData]);

  return (
    <div className="w-full h-full min-h-[950px] bg-[#fdfdfb] rounded-[3rem] p-12 border border-stone-200 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-stone-200/50">
      {/* Editorial Header */}
      <div className="mb-12 text-center max-w-xl">
        <p className="text-xs font-sans text-stone-400 uppercase tracking-[0.4em] font-bold">Territorial Distribution Analysis</p>
        <div className="h-px w-32 bg-stone-300 mx-auto mt-6"></div>
      </div>

      <div className="relative w-full max-w-[700px] aspect-[7/9] flex justify-center">
        <svg 
          ref={svgRef}
          viewBox="0 0 700 900" 
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 40px 60px rgba(0,0,0,0.08))' }}
        ></svg>

        {/* Manual Insets for CT and M - Geographically distant but relevant */}
        <div className="absolute top-0 right-0 flex flex-col gap-6">
          <div className="group flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-white border border-stone-100 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center cursor-pointer group-hover:bg-stone-50 transition-all" onClick={() => onRegionClick('CT')}>
              <div className="w-full h-full rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: getColor('CT') }}></div>
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Ticino</span>
          </div>
          
          <div className="group flex flex-col items-center gap-2">
            <div className="w-24 h-24 bg-white border border-stone-100 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center cursor-pointer group-hover:bg-stone-50 transition-all" onClick={() => onRegionClick('M')}>
              <div className="w-full h-full rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: getColor('M') }}></div>
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Malta</span>
          </div>
        </div>

        {/* Floating Info Card */}
        {hoveredRegion && (
          <div className="absolute bottom-20 left-0 bg-white border border-stone-100 p-8 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-8 duration-500 z-50 min-w-[280px]">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-[0.3em] mb-3">Territory</div>
            <div className="text-3xl font-serif italic text-stone-900 mb-6">{REGIONS_MAP[hoveredRegion] || hoveredRegion}</div>
            <div className="flex items-center justify-between border-t border-stone-50 pt-6">
              <div>
                <div className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-2">Species Count</div>
                <div className="text-5xl font-light text-stone-900 leading-none">
                  {hasAllRegionalData ? stats.regionStats[hoveredRegion] || 0 : stats.macroStats[Object.entries(MACRO_REGIONS).find(([_, codes]) => codes.includes(hoveredRegion))?.[0] || 'N']}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Card */}
      <div className="mt-auto w-full max-w-2xl bg-white border border-stone-100 rounded-[2.5rem] p-10 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-[0.2em] mb-2">Map Legend</h3>
            <p className="text-[11px] text-stone-400">Data resolution: <span className="text-stone-600 font-bold uppercase tracking-widest">{hasAllRegionalData ? 'Regional' : 'Macro-regional'}</span></p>
          </div>
          <div className="flex gap-2">
            {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-200"></div>)}
          </div>
        </div>
        
        {data.length === 1 ? (
          <div className="grid grid-cols-3 gap-12">
            <div className="flex items-center gap-5">
              <div className="w-6 h-6 rounded-full bg-[#86efac] border-2 border-white shadow-lg"></div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Present</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-6 h-6 rounded-full bg-[#fef08a] border-2 border-white shadow-lg"></div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Doubtful</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-6 h-6 rounded-full bg-[#f1f5f9] border-2 border-white shadow-lg"></div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Absent</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#f7fcf5] via-[#74c476] to-[#00441b] shadow-inner"></div>
            <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-[0.4em]">
              <span>{Math.min(...(hasAllRegionalData ? Object.values(stats.regionStats) : Object.values(stats.macroStats)) as number[])} Species</span>
              <span>{Math.max(...(hasAllRegionalData ? Object.values(stats.regionStats) : Object.values(stats.macroStats)) as number[])} Species</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};