import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { SpeciesData, REGIONS_MAP } from '../types';

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

  const stats = useMemo(() => {
    const regionStats: Record<string, number> = {};
    Object.keys(REGIONS_MAP).forEach(code => {
      regionStats[code] = data.filter(row => row[code] === 'y').length;
    });
    return { regionStats };
  }, [data]);

  const colorScale = useMemo(() => {
    return d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateRgb("#1065AB", "#B31529"));
  }, []);

  const getColor = (code: string) => {
    if (data.length === 0) return '#f1f5f9';
    
    if (data.length === 1) {
      const row = data[0];
      const val = row[code];
      
      if (val === 'y') return '#86efac'; // soft green
      if (val === '?') return '#fef08a'; // soft yellow
      return '#f1f5f9'; // soft slate
    } else {
      const counts = Object.values(stats.regionStats) as number[];
      const maxVal = Math.max(...counts, 1);
      const minVal = Math.min(...counts);

      const count = stats.regionStats[code] || 0;
      
      if (count === 0) return '#f1f5f9';

      const t = maxVal === minVal ? 1 : (count - minVal) / (maxVal - minVal);
      return colorScale(t);
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
        coordinates: [ [ [ 9.405307844466567, 41.723804387582113 ], [ 9.383431711341574, 41.649761538227416 ], [ 9.286510319381238, 41.605669135935102 ], [ 9.367819171366634, 41.593281742238048 ], [ 9.275934633204354, 41.528975722108406 ], [ 9.287259514328193, 41.483790936903226 ], [ 9.225861820615306, 41.442532083010612 ], [ 9.218623285887398, 41.40752361028656 ], [ 9.26338498902215, 41.426433587808837 ], [ 9.219627332880458, 41.368037674989175 ], [ 9.095789540398993, 41.393867117443186 ], [ 9.118568480384525, 41.437814846493815 ], [ 9.072341265695263, 41.444125518183291 ], [ 9.079939036705287, 41.477490181399375 ], [ 9.039971911736471, 41.457190102938142 ], [ 8.844924217525206, 41.51772689145654 ], [ 8.851779351289851, 41.541646414140864 ], [ 8.787374277668789, 41.56027323135234 ], [ 8.792686105775315, 41.629141834656039 ], [ 8.86950248302483, 41.646094582834898 ], [ 8.912302175747534, 41.690968137726145 ], [ 8.786208623756115, 41.703393973596334 ], [ 8.777758351541459, 41.740349008780676 ], [ 8.660998475015099, 41.739102850343613 ], [ 8.73156491350688, 41.780500419583774 ], [ 8.717186119743149, 41.803463280794496 ], [ 8.771293445936237, 41.811239495998748 ], [ 8.755378173710548, 41.845155191025043 ], [ 8.802583204586574, 41.892612057686215 ], [ 8.747681408356211, 41.932980107818587 ], [ 8.609260724878462, 41.895592133470622 ], [ 8.622969465271767, 41.934391301203441 ], [ 8.593911031955656, 41.963567008645192 ], [ 8.648732518799617, 41.968935714851334 ], [ 8.65829050359112, 42.010587952778955 ], [ 8.7439305827189, 42.059452401986157 ], [ 8.701201048419884, 42.111186228334965 ], [ 8.578625388912606, 42.127931181938649 ], [ 8.573349223922857, 42.227574406193604 ], [ 8.538297859851799, 42.236725432978382 ], [ 8.69096771019778, 42.266208330559657 ], [ 8.602204278658647, 42.311935266220878 ], [ 8.615678019773627, 42.347463870963843 ], [ 8.556929278170552, 42.335117714417549 ], [ 8.544337233506933, 42.367923444272137 ], [ 8.65655172452718, 42.417638535266455 ], [ 8.679451667581482, 42.467282303366446 ], [ 8.647890078726169, 42.474972327613003 ], [ 8.664657852156488, 42.514393967763979 ], [ 8.720073754223952, 42.524673476105718 ], [ 8.710433663415481, 42.576908638511327 ], [ 8.784057248482178, 42.55707652765291 ], [ 8.805764857659868, 42.601914777492127 ], [ 9.01758203210049, 42.64256200706059 ], [ 9.123389648682867, 42.730295248775128 ], [ 9.221748075603211, 42.73419346374569 ], [ 9.286949865049758, 42.675863719225561 ], [ 9.321130761610506, 42.696025446225818 ], [ 9.342508689078926, 42.794218024201967 ], [ 9.310033423748134, 42.832482861864591 ], [ 9.340296138534139, 42.865670455535792 ], [ 9.321680171238272, 42.895810665795217 ], [ 9.359475439344676, 42.92288688257868 ], [ 9.343577145277855, 42.997738894730141 ], [ 9.421454163383331, 43.010730689772586 ], [ 9.460566721022367, 42.985852098853456 ], [ 9.484088028758697, 42.853813332049896 ], [ 9.449197193628908, 42.662244978511467 ], [ 9.533934376064618, 42.543526166677424 ], [ 9.5587452153913, 42.19575714984753 ], [ 9.549283709661312, 42.103864618200554 ], [ 9.413558241530506, 41.955191770673444 ], [ 9.405307844466567, 41.723804387582113 ] ] ]
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

  }, [geoData, data, stats]);

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
            <div 
              className="w-24 h-24 bg-white border border-stone-100 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center cursor-pointer group-hover:bg-stone-50 transition-all" 
              onClick={() => onRegionClick('CT')}
              onMouseEnter={() => setHoveredRegion('CT')}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <div className="w-full h-full rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: getColor('CT') }}></div>
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">Ticino</span>
          </div>
          
          <div className="group flex flex-col items-center gap-2">
            <div 
              className="w-24 h-24 bg-white border border-stone-100 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center cursor-pointer group-hover:bg-stone-50 transition-all" 
              onClick={() => onRegionClick('M')}
              onMouseEnter={() => setHoveredRegion('M')}
              onMouseLeave={() => setHoveredRegion(null)}
            >
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
                  {stats.regionStats[hoveredRegion] || 0}
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
            <p className="text-[11px] text-stone-400">Data resolution: <span className="text-stone-600 font-bold uppercase tracking-widest">Regional</span></p>
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
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#1065AB] to-[#B31529] shadow-inner"></div>
            <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase tracking-[0.4em]">
              <span>{Math.min(...(Object.values(stats.regionStats) as number[]))} Species</span>
              <span>{Math.max(...(Object.values(stats.regionStats) as number[]))} Species</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};