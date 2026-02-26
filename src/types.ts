import { Type } from "@google/genai";

export interface SpeciesData {
  Phylum: string;
  Classe: string;
  Ordine: string;
  Famiglia: string;
  Genere: string;
  Sottogenere?: string;
  Specie: string;
  Sottospecie?: string;
  "Autore": string;
  "Nome Scientifico": string;
  // Macro-regions
  N: string;
  S: string;
  Si: string;
  Sa: string;
  // Regions
  Ao: string;
  Pi: string;
  Lo: string;
  VT: string;
  V: string;
  FVG: string;
  Li: string;
  ER: string;
  To: string;
  Ma: string;
  Um: string;
  La: string;
  Abr: string;
  Mo: string;
  Cp: string;
  Pu: string;
  Bas: string;
  Cal: string;
  RSM: string;
  CV: string;
  CT: string;
  Cor: string;
  M: string;
  [key: string]: any;
}

export const REGIONS_MAP: Record<string, string> = {
  Ao: "Valle d'Aosta",
  Pi: "Piemonte",
  Lo: "Lombardia",
  VT: "Trentino-Alto Adige",
  V: "Veneto",
  FVG: "Friuli-Venezia Giulia",
  Li: "Liguria",
  ER: "Emilia-Romagna",
  To: "Toscana",
  Ma: "Marche",
  Um: "Umbria",
  La: "Lazio",
  Abr: "Abruzzo",
  Mo: "Molise",
  Cp: "Campania",
  Pu: "Puglia",
  Bas: "Basilicata",
  Cal: "Calabria",
  Si: "Sicilia",
  Sa: "Sardegna",
  RSM: "Repubblica di San Marino",
  CV: "Città del Vaticano",
  CT: "Canton Ticino",
  Cor: "Corsica",
  M: "Arcipelago Maltese",
};

export const MACRO_REGIONS = {
  N: ["Ao", "Pi", "Lo", "VT", "V", "FVG", "Li", "ER"],
  S: ["To", "Ma", "Um", "La", "Abr", "Mo", "Cp", "Pu", "Bas", "Cal", "RSM", "CV", "CT", "Cor", "M"],
  Si: ["Si"],
  Sa: ["Sa"],
};

export const DISTRIBUTION_COLUMNS = [
  "N", "S", "Si", "Sa",
  "Ao", "Pi", "Lo", "VT", "V", "FVG", "Li", "ER",
  "To", "Ma", "Um", "La", "Abr", "Mo", "Cp", "Pu",
  "Bas", "Cal", "RSM", "CV", "CT", "Cor", "M"
];

export const RETAINED_COLUMNS = [
  "Nome Scientifico",
  "Autore",
  "Phylum",
  "Classe",
  "Ordine",
  "Famiglia",
  "Sottofamiglia",
  "Genere",
  "Specie",
  "Sottospecie",
  "End",
  "Alien",
  ...DISTRIBUTION_COLUMNS
];
