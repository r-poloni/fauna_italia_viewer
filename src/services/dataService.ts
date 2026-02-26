import Papa from 'papaparse';
import { SpeciesData } from '../types';

export async function loadAndProcessData(): Promise<SpeciesData[]> {
  const response = await fetch('./data.csv');
  const csvText = await response.text();
  
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data as any[];
        
        const processed = rawData
          .filter(row => row.Genere && row.Specie) // Remove rows where Genere or Specie are missing
          .map(row => {
            // Create Nome Scientifico following standard nomenclature: Genus (Subgenus) species subspecies
            const genus = row.Genere?.trim() || "";
            const subgenus = row.Sottogenere?.trim() || "";
            const species = row.Specie?.trim() || "";
            const subspecies = row.Sottospecie?.trim() || "";

            const nomeScientifico = [
              genus,
              subgenus ? `(${subgenus})` : "",
              species,
              subspecies
            ].filter(p => p !== "").join(" ");
            
            // Conditional retention logic for authors
            const hasSubspecies = !!row.Sottospecie && row.Sottospecie.trim() !== "";
            
            const result: any = {
              ...row,
              "Nome Scientifico": nomeScientifico,
              "Autore": hasSubspecies ? row["Autore e anno sottospecie"] : row["Autore e anno specie"]
            };

            // If subspecies exists, we might want to prioritize "Autore e anno sottospecie"
            // The user said: "Autore e anno specie (only if there is no subspecies), Autore e anno sottospecie (if there is a subspecies)"
            // This suggests we should probably merge them into a single "Autore" column or just handle them carefully.
            // For now, I'll keep both but the user can filter/view them.
            
            return result as SpeciesData;
          });
          
        resolve(processed);
      }
    });
  });
}
