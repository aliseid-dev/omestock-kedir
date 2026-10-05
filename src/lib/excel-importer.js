import * as XLSX from 'xlsx'

/**
 * Pre-parsed items from the Kaya Yasmin Auto Parts Excel inventory spreadsheet
 * (219 products with dedicated warehouse and retail store stock allocations)
 */
export const PRELOADED_KAYA_YASMIN_ITEMS = [
  {
    "code": "SP-001",
    "name": "12 KG GAS  nok",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 2950,
    "sellingPrice": 3500,
    "minStockThreshold": 5,
    "warehouseStock": 20,
    "storeStock": 76,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-002",
    "name": "12 KG GAS giyon",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 3300,
    "sellingPrice": 3500,
    "sellingPriceRange": "3500-3700",
    "minStockThreshold": 5,
    "warehouseStock": 149,
    "storeStock": 23,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-003",
    "name": "6 KG GAS",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 1300,
    "sellingPrice": 1800,
    "sellingPriceRange": "1800-2000",
    "minStockThreshold": 5,
    "warehouseStock": 0,
    "storeStock": 9,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-004",
    "name": "15kg",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 4000,
    "sellingPrice": 4500,
    "sellingPriceRange": "4500-5000",
    "minStockThreshold": 5,
    "warehouseStock": 38,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-005",
    "name": "22 KG GAS",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 5500,
    "sellingPrice": 6500,
    "sellingPriceRange": "6500-7000",
    "minStockThreshold": 5,
    "warehouseStock": 0,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "name": "3KG GAS giyon",
    "category": "Gas Cylinders",
    "unit": "Kg",
    "costPrice": 850,
    "sellingPrice": 1063,
    "minStockThreshold": 2,
    "warehouseStock": 18,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-06",
    "name": "64010 Fuel filter rinken",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 500,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-007",
    "name": "FLANja lokal DX",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 1800,
    "sellingPrice": 2500,
    "minStockThreshold": 6,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-008",
    "name": "ISUZU fuel filter",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-009",
    "name": "Coolant 1L",
    "category": "Coolants & Fluids",
    "unit": "Litre",
    "costPrice": 350,
    "sellingPrice": 500,
    "sellingPriceRange": "500-600",
    "minStockThreshold": 5,
    "storeStock": 11,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-10",
    "name": "Coolant 4L",
    "category": "Coolants & Fluids",
    "unit": "Litre",
    "costPrice": 1100,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1800",
    "minStockThreshold": 5,
    "storeStock": 12,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-011",
    "name": "OSCAR BREAK FLUD",
    "category": "Brake Fluids",
    "unit": "Piece",
    "costPrice": 150,
    "sellingPrice": 300,
    "minStockThreshold": 5,
    "storeStock": 22,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-012",
    "name": "Asmico break fluid 1/2",
    "category": "Brake Fluids",
    "unit": "Piece",
    "costPrice": 450,
    "sellingPrice": 500,
    "sellingPriceRange": "500-700",
    "minStockThreshold": 5,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-13",
    "name": "Delta break fluid 1/4",
    "category": "Brake Fluids",
    "unit": "Piece",
    "costPrice": 200,
    "sellingPrice": 300,
    "sellingPriceRange": "300-500",
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-014",
    "name": "RBI Corolla flanja",
    "category": "Flanges & Mounts",
    "unit": "Piece",
    "costPrice": 3500,
    "sellingPrice": 4500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-015",
    "name": "Flanja lokal COROLLA",
    "category": "Flanges & Mounts",
    "unit": "Piece",
    "costPrice": 1800,
    "sellingPrice": 2000,
    "minStockThreshold": 5,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-016",
    "name": "SDK 30002 oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 350,
    "sellingPrice": 500,
    "minStockThreshold": 5,
    "storeStock": 40,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-017",
    "name": "CBN 9505 oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 200,
    "sellingPrice": 450,
    "minStockThreshold": 5,
    "storeStock": 14,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-018",
    "name": "SDK D2 oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 300,
    "sellingPrice": 400,
    "minStockThreshold": 5,
    "storeStock": 6,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-019",
    "name": "0L040 cope fuel filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 2,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-020",
    "name": "Renken 77920 oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 28,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-021",
    "name": "Renken D2 oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 350,
    "sellingPrice": 500,
    "minStockThreshold": 5,
    "storeStock": 23,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-022",
    "name": "E1 oil filter cope",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 300,
    "sellingPrice": 400,
    "minStockThreshold": 5,
    "storeStock": 2,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-023",
    "name": "Yaris cartush oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 650,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-024",
    "name": "Toyota 30002 oil filter COPY",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "sellingPriceRange": "800-1500",
    "minStockThreshold": 5,
    "storeStock": 11,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-025",
    "name": "suzuki oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 700,
    "sellingPriceRange": "700-800",
    "minStockThreshold": 5,
    "storeStock": 31,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-026",
    "name": "Hyunday oil filter",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 17,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-027",
    "name": "Havoline 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 950,
    "sellingPrice": 1000,
    "sellingPriceRange": "1000-1300",
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-028",
    "name": "Quartz 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 1000,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1500",
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-029",
    "name": "Zoble 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 7,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-030",
    "name": "Rubia 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 1100,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1500",
    "minStockThreshold": 5,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-031",
    "name": "Delo 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 1100,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1800",
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-032",
    "name": "Gulf 1L",
    "category": "Engine Oils (1L)",
    "unit": "Litre",
    "costPrice": 500,
    "sellingPrice": 700,
    "minStockThreshold": 5,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-033",
    "name": "Automatic transmission fluid ATF",
    "category": "Transmission Fluids",
    "unit": "Litre",
    "costPrice": 1000,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1500",
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-034",
    "name": "DELO 5L COPY",
    "category": "Engine Oils (5L)",
    "unit": "Litre",
    "costPrice": 3000,
    "sellingPrice": 4000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-035",
    "name": "Delo 4L",
    "category": "Engine Oils (4L)",
    "unit": "Litre",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-036",
    "name": "Toyota rubiya 5L",
    "category": "Engine Oils (5L)",
    "unit": "Litre",
    "costPrice": 4500,
    "sellingPrice": 5000,
    "sellingPriceRange": "5000-6000",
    "minStockThreshold": 3,
    "storeStock": 17,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-037",
    "name": "Havoline 4L",
    "category": "Engine Oils (4L)",
    "unit": "Litre",
    "costPrice": 4200,
    "sellingPrice": 4550,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-039",
    "name": "SIN GUIF 4L",
    "category": "Engine Oils (4L)",
    "unit": "Litre",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-040",
    "name": "DEOMAX 15W-40 4L",
    "category": "Engine Oils (4L)",
    "unit": "Litre",
    "costPrice": 2000,
    "sellingPrice": 3000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-041",
    "name": "Elell 4L",
    "category": "Engine Oils (4L)",
    "unit": "Litre",
    "costPrice": 2000,
    "sellingPrice": 3000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-042",
    "name": "Elell 5L",
    "category": "Engine Oils (5L)",
    "unit": "Litre",
    "costPrice": 3000,
    "sellingPrice": 4500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-043",
    "name": "ASMIco break fluid 1/4",
    "category": "OIL",
    "unit": "Piece",
    "costPrice": 200,
    "sellingPrice": 300,
    "minStockThreshold": 3,
    "storeStock": 9,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-044",
    "name": "FuEL pump",
    "category": "Fuel Pumps",
    "unit": "Piece",
    "costPrice": 2800,
    "sellingPrice": 3500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-045",
    "name": "OIL treatment",
    "category": "Additives & Treatments",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 17,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-046",
    "name": "Diesel treatment",
    "category": "Additives & Treatments",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-047",
    "name": "Cherish 1/2",
    "category": "Lubricants & Greases",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-048",
    "name": "Cherish 1KG",
    "category": "Lubricants & Greases",
    "unit": "Kg",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-049",
    "name": "1KG ANOX GREASE",
    "category": "Lubricants & Greases",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-050",
    "name": "cv joint boot RBI",
    "category": "CV Boots",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1400,
    "minStockThreshold": 5,
    "storeStock": 35,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-051",
    "name": "CV joint local ultra-max",
    "category": "CV Joints",
    "unit": "Piece",
    "costPrice": 2800,
    "sellingPrice": 3200,
    "minStockThreshold": 5,
    "storeStock": 11,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-052",
    "name": "meri boot RBI",
    "category": "CV Boots",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1400,
    "minStockThreshold": 5,
    "storeStock": 29,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-053",
    "name": "HDk CV JOINT SMALL",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 7500,
    "sellingPrice": 8500,
    "minStockThreshold": 3,
    "storeStock": 13,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-054",
    "name": "HDK LONG 57",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 10500,
    "sellingPrice": 11000,
    "sellingPriceRange": "11000-12000",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-055",
    "name": "6308 KOYO",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 3000,
    "minStockThreshold": 3,
    "storeStock": 9,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-056",
    "name": "SMOL KOYO BEARING",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 800,
    "sellingPriceRange": "800-1200",
    "minStockThreshold": 5,
    "storeStock": 29,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-057",
    "name": "48548 KOYO",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1500",
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-058",
    "name": "12649 KOYO",
    "category": "Bearings",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1200,
    "sellingPriceRange": "1200-1500",
    "minStockThreshold": 5,
    "storeStock": 14,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-059",
    "name": "VEEDOL 15W-40",
    "category": "oil",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 4,
    "storeStock": 4,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-060",
    "name": "VEEDOL 20W-50",
    "category": "OIL",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 4,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-061",
    "name": "GP 20W 40",
    "category": "Brake Discs",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-062",
    "name": "DISC 5L",
    "category": "Brake Discs",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "sellingPriceRange": "5500-6000",
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-063",
    "name": "DISC D4D",
    "category": "Brake Discs",
    "unit": "Piece",
    "costPrice": 7500,
    "sellingPrice": 8500,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-064",
    "name": "abro dashboard kbat",
    "category": "Car Care & Chemicals",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-065",
    "name": "polish car",
    "category": "Car Care & Chemicals",
    "unit": "Piece",
    "costPrice": 700,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-066",
    "name": "Choke cleaner",
    "category": "Car Care & Chemicals",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 900,
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-067",
    "name": "Toyota corolla air filter 22020",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-800",
    "minStockThreshold": 5,
    "storeStock": 17,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-068",
    "name": "RV4 air filter RINKEN 31120",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2000,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-069",
    "name": "karina air filter flexible RINKEN",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 1000,
    "sellingPrice": 1500,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-070",
    "name": "karina air filter derek RINKEN",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 1000,
    "sellingPrice": 1500,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-071",
    "name": "Corolla air filter RINKEN",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 350,
    "sellingPrice": 500,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-072",
    "name": "yaris SEFIW air filter21050",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-700",
    "minStockThreshold": 5,
    "storeStock": 15,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "6",
    "name": "dolfin 54140 air filter",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 5,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-074",
    "name": "Renken D4D air filter",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2300,
    "minStockThreshold": 5,
    "storeStock": 16,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-075",
    "name": "rivo 0L040 renken air filter",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2000,
    "minStockThreshold": 5,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-077",
    "name": "vits renken air filter",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 300,
    "sellingPrice": 350,
    "sellingPriceRange": "350-400",
    "minStockThreshold": 5,
    "storeStock": 48,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-078",
    "name": "ultimat shock absorber rear",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2200,
    "sellingPriceRange": "2200-3000",
    "minStockThreshold": 5,
    "storeStock": 25,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-079",
    "name": "ultimat shock absorber front",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 4400,
    "sellingPrice": 5000,
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-080",
    "name": "flato 5L",
    "category": "Suspension Parts",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 6500,
    "minStockThreshold": 5,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-081",
    "name": "frisyon shera corolla lokal",
    "category": "Suspension Parts",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 5,
    "storeStock": 13,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-082",
    "name": "Bobina chaf",
    "category": "Ignition Parts",
    "unit": "Piece",
    "costPrice": 1300,
    "sellingPrice": 1500,
    "sellingPriceRange": "1500-1800",
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-083",
    "name": "spark plugs 35 yaris",
    "category": "Spark Plugs",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-700",
    "minStockThreshold": 5,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-084",
    "name": "spark plugs vitz",
    "category": "Spark Plugs",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 550,
    "minStockThreshold": 5,
    "storeStock": 28,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-085",
    "name": "clax",
    "category": "Clutch Parts",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 12,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-086",
    "name": "lokal kit super",
    "category": "Timing & Chain Kits",
    "unit": "Piece",
    "costPrice": 300,
    "sellingPrice": 600,
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-087",
    "name": "kefta gomini",
    "category": "Engine Parts",
    "unit": "Piece",
    "costPrice": 450,
    "sellingPrice": 600,
    "sellingPriceRange": "600 -700",
    "minStockThreshold": 5,
    "storeStock": 16,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-088",
    "name": "seporto yefit 5L",
    "category": "Engine Parts",
    "unit": "Piece",
    "costPrice": 3500,
    "sellingPrice": 4000,
    "minStockThreshold": 5,
    "storeStock": 14,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-089",
    "name": "bushing '/'\\[",
    "category": "Suspension Bushings",
    "unit": "Piece",
    "costPrice": 1300,
    "sellingPrice": 2150,
    "minStockThreshold": 5,
    "storeStock": 82,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-090",
    "name": "ranked  5L",
    "category": "Suspension Parts",
    "unit": "Piece",
    "costPrice": 750,
    "sellingPrice": 1200,
    "minStockThreshold": 5,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-091",
    "name": "link '']'\\",
    "category": "Suspension Links",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 5,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-092",
    "name": "spring",
    "category": "Suspension Springs",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 5,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-093",
    "name": "hydraulic pump master cylinder",
    "category": "Brake Master Cylinder",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 6000,
    "minStockThreshold": 5,
    "storeStock": 11,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-094",
    "name": "link vitz",
    "category": "Suspension Links",
    "unit": "Piece",
    "costPrice": 700,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-095",
    "name": "bracho tistine",
    "category": "Brake Parts",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 1200,
    "minStockThreshold": 5,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-096",
    "name": "meri tistine 5l",
    "category": "Brake Parts",
    "unit": "Piece",
    "costPrice": 750,
    "sellingPrice": 1000,
    "minStockThreshold": 5,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-097",
    "name": "30002 oil filter Or",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 4000,
    "sellingPrice": 4500,
    "minStockThreshold": 5,
    "storeStock": 19,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-098",
    "name": "D2 oil filter Or",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 5,
    "storeStock": 37,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-099",
    "name": "38010 oil filter or",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5700,
    "minStockThreshold": 5,
    "storeStock": 20,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-100",
    "name": "N2 oil filter Or",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2400,
    "minStockThreshold": 5,
    "storeStock": 34,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-101",
    "name": "38020 V8 oil filter  or",
    "category": "Oil Filters",
    "unit": "Piece",
    "costPrice": 4500,
    "sellingPrice": 5000,
    "minStockThreshold": 5,
    "storeStock": 3,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-102",
    "name": "30180 fuel filter or",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 8000,
    "sellingPrice": 8800,
    "minStockThreshold": 5,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-103",
    "name": "0l070 fuel filter or",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 6500,
    "sellingPrice": 7000,
    "minStockThreshold": 5,
    "storeStock": 17,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-104",
    "name": "0l041 fuel filter or",
    "category": "Filters",
    "unit": "Piece",
    "costPrice": 4000,
    "sellingPrice": 4600,
    "minStockThreshold": 5,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-105",
    "name": "0l040 air filter 0r",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 7000,
    "sellingPrice": 7800,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-106",
    "name": "67060 air filter or",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 10000,
    "sellingPrice": 10900,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-107",
    "name": "61030 air filter or",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 8500,
    "sellingPrice": 9000,
    "minStockThreshold": 5,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-108",
    "name": "51020 air filter or",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 8500,
    "sellingPrice": 9100,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-109",
    "name": "0c010 AIR FILTER or",
    "category": "Air Filters",
    "unit": "Piece",
    "costPrice": 8000,
    "sellingPrice": 9000,
    "minStockThreshold": 5,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-110",
    "name": "F070-U3768 FR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 13500,
    "sellingPrice": 15000,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-111",
    "name": "R122-E2981 FR SHOCK ABSORBER THL",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 9000,
    "sellingPrice": 10000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-112",
    "name": "S261-2979 FR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 11900,
    "sellingPrice": 13000,
    "minStockThreshold": 3,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-113",
    "name": "R129-E3803 RR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 8000,
    "sellingPrice": 10000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-114",
    "name": "F088-B3240 FR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 15000,
    "sellingPrice": 16000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-115",
    "name": "F087-B2220 FR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 14000,
    "sellingPrice": 15000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-116",
    "name": "R126-E2949 RR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 8000,
    "sellingPrice": 10000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-117",
    "name": "F063-B3232 FR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 15500,
    "sellingPrice": 16500,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-118",
    "name": "R133-U2980 FR SHOCK ABSORBER TWL",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 10000,
    "sellingPrice": 11000,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-119",
    "name": "R129-E3803 RR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 8500,
    "sellingPrice": 9500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-120",
    "name": "R130-E3804 RR SHOCK ABSORBER THO",
    "category": "Shock Absorbers",
    "unit": "Piece",
    "costPrice": 8500,
    "sellingPrice": 10000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-121",
    "name": "P013-YZZE1 PAD KIT JPL",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 25000,
    "sellingPrice": 26000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-122",
    "name": "P022-YZZR5 PAD KIT JPL",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 24000,
    "sellingPrice": 25000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-123",
    "name": "PO056-YZZR2 PAD KIT JPO",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 25000,
    "sellingPrice": 26000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-124",
    "name": "P024-YZZAM PAD KIT JPL",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 16000,
    "sellingPrice": 17000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-125",
    "name": "P083-26420 PAD KIT CHL",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 6000,
    "sellingPrice": 7000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-126",
    "name": "P018-YZZF4 PAD KIT JPL",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 14000,
    "sellingPrice": 15000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-127",
    "name": "P046-YZZE2 PAD KIT JPO",
    "category": "Brake Pads",
    "unit": "KIT",
    "costPrice": 14000,
    "sellingPrice": 15500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-128",
    "name": "Quartz 4L",
    "category": "Oil",
    "unit": "Litre",
    "costPrice": 4000,
    "sellingPrice": 5000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-129",
    "name": "HAVOLINE DOT 4 1/2",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 1400,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-130",
    "name": "KOBIL DOT  4 1/2",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 400,
    "sellingPrice": 800,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-131",
    "name": "KOBIL 15W-40",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 2000,
    "sellingPrice": 3000,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-132",
    "name": "KOBIL 20W-50",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 2000,
    "sellingPrice": 3500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-134",
    "name": "CASTROL 4L",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 4500,
    "sellingPrice": 5625,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-135",
    "name": "GAG 4L",
    "category": "OIL",
    "unit": "Kg",
    "costPrice": 1800,
    "sellingPrice": 2250,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-136",
    "name": "QUARTZ 9OOO 1L",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 6500,
    "sellingPrice": 8125,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-137",
    "name": "QUARTZ 9000 4L",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 0,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-138",
    "name": "OLA DEO MAX 5L",
    "category": "OIL",
    "unit": "Kg",
    "costPrice": 700,
    "sellingPrice": 875,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-139",
    "name": "GP 15W-40 4l",
    "category": "OIL",
    "unit": "Litre",
    "costPrice": 1000,
    "sellingPrice": 1250,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-140",
    "name": "RINKEN 10500D AIR FILTER",
    "category": "SPER",
    "unit": "KIT",
    "costPrice": 600,
    "sellingPrice": 700,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-141",
    "name": "toyota td004",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 600,
    "sellingPrice": 800,
    "minStockThreshold": 3,
    "storeStock": 52,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-142",
    "name": "60200 DX FILTER",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-143",
    "name": "FRESYON SHERA 5L COPY",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 3000,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP- 144",
    "name": "COROLLA REAR BEARING RBI",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 6500,
    "sellingPrice": 8500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-145",
    "name": "YEFIT BERAING KOYO 4074",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 6000,
    "sellingPrice": 6500,
    "minStockThreshold": 3,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-146",
    "name": "YEFIT BERAING KOYO 4075",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 6000,
    "sellingPrice": 6500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-147",
    "name": "BEARING 6206",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-148",
    "name": "BEARING 6205",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-149",
    "name": "FLANGA DX RBI",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 3000,
    "sellingPrice": 3500,
    "sellingPriceRange": "3500-400",
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-150",
    "name": "DISC COROLLA",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 6000,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-151",
    "name": "DISC VITS",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-152",
    "name": "DISC YARIS",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5500,
    "sellingPrice": 6000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-153",
    "name": "DISC DX",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 4000,
    "sellingPrice": 5000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-154",
    "name": "KIT 35070 5L",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1800,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-155",
    "name": "KIT 30054",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 300,
    "sellingPrice": 400,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-156",
    "name": "boot lokal",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-800",
    "minStockThreshold": 3,
    "storeStock": 28,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-157",
    "name": "boot yamato",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 20,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-158",
    "name": "WIPER",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 900,
    "sellingPrice": 1200,
    "minStockThreshold": 3,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-159",
    "name": "ISUZU OIL FILTER",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 800,
    "sellingPrice": 1000,
    "minStockThreshold": 3,
    "storeStock": 14,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-160",
    "name": "SINO OIL FILTER",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1000,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 9,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-161",
    "name": "SINO FUEL FILTER",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 1800,
    "minStockThreshold": 3,
    "storeStock": 15,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-162",
    "name": "DELTA 4L",
    "category": "oil",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2300,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-163",
    "name": "BENZON 4L",
    "category": "oil",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 2600,
    "sellingPriceRange": "2600-3000",
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-164",
    "name": "OSCAR 4L",
    "category": "oil",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2200,
    "sellingPriceRange": "2200-3000",
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-165",
    "name": "GREASE KOBIL 3KG",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1300,
    "sellingPrice": 1500,
    "sellingPriceRange": "1500-200",
    "minStockThreshold": 3,
    "storeStock": 7,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-166",
    "name": "KOBIL 1/2 GREASE",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 500,
    "sellingPriceRange": "500-600",
    "minStockThreshold": 3,
    "storeStock": 18,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-167",
    "name": "COROLLA SHOE SHOE ASMICO RR",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 2700,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-168",
    "name": "VITS BREAK SHOE RR",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 2700,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-169",
    "name": "DX BREAK SHOE RR",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1800,
    "sellingPrice": 2300,
    "minStockThreshold": 3,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-170",
    "name": "ASMICO FRONT BREAK PADE",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2100,
    "sellingPriceRange": "2100-3000",
    "minStockThreshold": 3,
    "storeStock": 101,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-171",
    "name": "5L BREAK SHOE RR",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-172",
    "name": "JSS 100",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-173",
    "name": "GMB 116",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-174",
    "name": "GMB 79",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 4500,
    "sellingPrice": 5000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-175",
    "name": "GMB 101",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "minStockThreshold": 3,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-176",
    "name": "GMB 100",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 4800,
    "sellingPrice": 5000,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-177",
    "name": "GMB 142",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5500,
    "sellingPrice": 6000,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-178",
    "name": "GMB 93",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-179",
    "name": "meri testini   dx",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2200,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-180",
    "name": "flanja vitz",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 5500,
    "sellingPrice": 6000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-181",
    "name": "link 0k030 D4D",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 3000,
    "sellingPrice": 3200,
    "sellingPriceRange": "3200-3500",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-182",
    "name": "link  0k010",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 3000,
    "sellingPrice": 3500,
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-183",
    "name": "link 42030 rva 4",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 3000,
    "sellingPrice": 3500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-184",
    "name": "seporto  0d030  YEFIT",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 4800,
    "sellingPrice": 5500,
    "sellingPriceRange": "5500-5700",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-185",
    "name": "SEPORTO OD060 YEHALA",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 6500,
    "sellingPrice": 7000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-186",
    "name": "link 47010  corolla",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-187",
    "name": "link 0d020",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-188",
    "name": "breeak shok 74020 or",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 34000,
    "sellingPrice": 35000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-189",
    "name": "break shoe 52010or",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 14000,
    "sellingPrice": 15000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-190",
    "name": "break shoe 52140 or",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 14000,
    "sellingPrice": 15000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-191",
    "name": "break shoe 0k120 or",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 25000,
    "sellingPrice": 28000,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-192",
    "name": "bushing 0d040 tlku",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 4000,
    "sellingPrice": 4500,
    "minStockThreshold": 3,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-193",
    "name": "bushing 55-ok040",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2500,
    "sellingPrice": 2800,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-194",
    "name": "busheng 12170",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1600,
    "sellingPrice": 2000,
    "sellingPriceRange": "2000-2200",
    "minStockThreshold": 3,
    "storeStock": 14,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-195",
    "name": "bushing12120 tnsho",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "sellingPriceRange": "1500-2000",
    "minStockThreshold": 3,
    "storeStock": 8,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-196",
    "name": "bushing 42060",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2000,
    "sellingPrice": 2400,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-197",
    "name": "bushing 0d060",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-198",
    "name": "bushing 26050",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1500,
    "sellingPrice": 2500,
    "sellingPriceRange": "2500-2800",
    "minStockThreshold": 3,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-199",
    "name": "bushing 26090",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 5,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-200",
    "name": "bushing 26070",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 2400,
    "sellingPrice": 3500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-201",
    "name": "bushing 26030",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 950,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-202",
    "name": "bushing 20060",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 900,
    "sellingPrice": 1200,
    "minStockThreshold": 3,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-203",
    "name": "bushing od140",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 950,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 3,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-204",
    "name": "bushing 26010",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 1700,
    "sellingPrice": 2000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-205",
    "name": "fire stop 1 kg",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 700,
    "sellingPrice": 800,
    "sellingPriceRange": "800-100",
    "minStockThreshold": 3,
    "storeStock": 10,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-206",
    "name": "fire stop 500 ml",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-800",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-20",
    "name": "fire stop 500 ml",
    "category": "SPER",
    "unit": "pice",
    "costPrice": 500,
    "sellingPrice": 600,
    "sellingPriceRange": "600-800",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-208",
    "name": "chinga vitz",
    "category": "SPER",
    "unit": "pice",
    "costPrice": 450,
    "sellingPrice": 800,
    "minStockThreshold": 33,
    "storeStock": 6,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-209",
    "name": "quatol 4l",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 3500,
    "sellingPrice": 3800,
    "sellingPriceRange": "3800-400",
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-210",
    "name": "reguleter  gas",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 1200,
    "sellingPrice": 1500,
    "sellingPriceRange": "1500-2000",
    "minStockThreshold": 3,
    "storeStock": 97,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-211",
    "name": "delo 15-40 5L",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 22000,
    "sellingPrice": 24000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-212",
    "name": "GULF  140 25L",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 10000,
    "sellingPrice": 12000,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-213",
    "name": "OSCAR  68   20L",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 6500,
    "sellingPrice": 7500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-214",
    "name": "GULCHA",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 1000,
    "sellingPrice": 1500,
    "minStockThreshold": 3,
    "storeStock": 8,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-215",
    "name": "3 KG",
    "category": "oil",
    "unit": "ll",
    "costPrice": 1400,
    "sellingPrice": 1400,
    "minStockThreshold": 3,
    "storeStock": 16,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-216",
    "name": "3 KG  BADOEKA",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 3000,
    "sellingPrice": 3750,
    "minStockThreshold": 3,
    "storeStock": 17,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-217",
    "name": "90 OIL  20",
    "category": "oil",
    "unit": "Litre",
    "costPrice": 8000,
    "sellingPrice": 10000,
    "minStockThreshold": 3,
    "storeStock": 2,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-218",
    "name": "BATRI 45A",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 9000,
    "sellingPrice": 9500,
    "sellingPriceRange": "9500-11000",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-219",
    "name": "BATRI 60",
    "category": "SPER",
    "unit": "Piece",
    "costPrice": 10000,
    "sellingPrice": 1100,
    "sellingPriceRange": "1100-1300",
    "minStockThreshold": 3,
    "storeStock": 4,
    "defaultCommissionRate": 2.5
  },
  {
    "code": "SP-220",
    "name": "TASAW ATF",
    "category": "oil",
    "unit": "Piece",
    "costPrice": 5000,
    "sellingPrice": 5500,
    "sellingPriceRange": "5500-6500",
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 0.5
  },
  {
    "code": "SP-221",
    "name": "HOZ",
    "category": "General",
    "unit": "Piece",
    "costPrice": 400,
    "sellingPrice": 500,
    "minStockThreshold": 3,
    "storeStock": 1,
    "defaultCommissionRate": 2.5
  }
]

/**
 * Universal Excel & CSV Inventory Parser
 * Supports multi-sheet workbooks (e.g. "Inventory store" as Warehouse and "Inventory shop" as Store)
 * or single sheet with flexible column detection.
 *
 * @param {File | ArrayBuffer | any} fileOrBuffer
 * @returns {Promise<{ items: Array, summary: Object, sheetsDetected: Array, fileName: string }>}
 */
export async function parseInventoryExcel(fileOrBuffer) {
  let arrayBuffer
  let fileName = 'Uploaded Spreadsheet'

  if (typeof File !== 'undefined' && fileOrBuffer instanceof File) {
    fileName = fileOrBuffer.name
    arrayBuffer = await fileOrBuffer.arrayBuffer()
  } else if (fileOrBuffer && typeof fileOrBuffer.arrayBuffer === 'function') {
    arrayBuffer = await fileOrBuffer.arrayBuffer()
  } else {
    arrayBuffer = fileOrBuffer
  }

  const isBuffer = typeof Buffer !== 'undefined' && Buffer.isBuffer(arrayBuffer)
  const workbook = XLSX.read(arrayBuffer, { type: isBuffer ? 'buffer' : 'array' })
  const sheetNames = workbook.SheetNames || []

  if (sheetNames.length === 0) {
    throw new Error('No sheets found in the uploaded workbook.')
  }

  const parseSheetRows = (sheet) => {
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    if (!rawRows || rawRows.length === 0) return []

    // Detect header row by looking for standard inventory headers, ignoring search bar rows
    const headerIdx = rawRows.findIndex((r) =>
      r && Array.isArray(r) && r.some((c) =>
        typeof c === 'string' &&
        ((/^item\s*name|^product\s*name/i.test(c.trim())) || (/item\s*name/i.test(c.trim()) && !c.includes('←') && !c.includes('🔍')))
      )
    )

    if (headerIdx === -1) return []

    const headers = rawRows[headerIdx].map((h) => String(h || '').trim())
    const idCol = headers.findIndex((h) => /item\s*id|item\s*code|code|sku|part #|part number/i.test(h))
    const nameCol = headers.findIndex((h) => /item\s*name|product\s*name|product|description|title/i.test(h))
    const catCol = headers.findIndex((h) => /category|group|type|department|dept/i.test(h))
    const unitCol = headers.findIndex((h) => /unit|uom|measure/i.test(h))
    const costCol = headers.findIndex((h) => /purchase\s*price|cost\s*price|cost|buy price|wholesale/i.test(h))
    const priceCol = headers.findIndex((h) => /selling\s*price|retail price|sale price|price|mrp/i.test(h))
    const alertCol = headers.findIndex((h) => /min\s*stock|alert|threshold|low stock/i.test(h))
    const stockCol = headers.findIndex((h) => /stock\s*on\s*hand|quantity|qty|stock|balance|opening stock/i.test(h))

    // Fallback if name column wasn't explicitly named
    const effectiveNameCol = nameCol !== -1 ? nameCol : (idCol !== -1 && headers.length > idCol + 1 ? idCol + 1 : 1)

    const items = []
    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i]
      if (!row || !Array.isArray(row)) continue

      const name = String(row[effectiveNameCol] || (idCol !== -1 ? row[idCol] : '') || '').trim()
      if (!name || name.toLowerCase().includes('total') || name.startsWith('🔍')) continue

      const code = idCol !== -1 && row[idCol] ? String(row[idCol]).trim() : undefined
      const category = catCol !== -1 && row[catCol] ? String(row[catCol]).trim() : 'General'
      
      let unit = unitCol !== -1 && row[unitCol] ? String(row[unitCol]).trim() : 'Piece'
      if (unit.toUpperCase() === 'L') unit = 'Litre'
      if (unit.toUpperCase() === 'KG') unit = 'Kg'

      const cost = costCol !== -1 ? (parseFloat(row[costCol]) || 0) : 0
      const rawPrice = priceCol !== -1 ? row[priceCol] : undefined

      let price = 0
      let priceRange = undefined
      if (typeof rawPrice === 'number') {
        price = rawPrice
      } else if (typeof rawPrice === 'string') {
        priceRange = rawPrice.trim()
        const match = rawPrice.match(/\d+(\.\d+)?/)
        price = match ? parseFloat(match[0]) : 0
      }
      if (!price && cost > 0) {
        price = Math.round(cost * 1.25)
      }

      const alert = alertCol !== -1 ? (parseInt(row[alertCol], 10) || 5) : 5
      const stock = stockCol !== -1 ? (parseInt(row[stockCol], 10) || 0) : 0

      items.push({
        code,
        name,
        category,
        unit,
        costPrice: cost,
        sellingPrice: price,
        sellingPriceRange: priceRange,
        minStockThreshold: alert,
        stock,
      })
    }
    return items
  }

  // Detect which sheets map to warehouse vs store
  let hasWarehouseSheet = false
  let hasShopSheet = false

  const parsedSheets = {}
  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name]
    const items = parseSheetRows(sheet)
    parsedSheets[name] = items
    if (/store|warehouse|storage|depot/i.test(name)) hasWarehouseSheet = true
    if (/shop|retail|front/i.test(name)) hasShopSheet = true
  }

  const mergedMap = new Map()

  if (sheetNames.length >= 2 && hasWarehouseSheet && hasShopSheet) {
    // Multi-sheet workbook like Kaya Yasmin (Inventory store = Warehouse, Inventory shop = Store)
    for (const sheetName of sheetNames) {
      const isShop = /shop|retail|front/i.test(sheetName)
      const items = parsedSheets[sheetName] || []

      for (const it of items) {
        const key = (it.code || it.name).toLowerCase().trim()
        if (mergedMap.has(key)) {
          const ex = mergedMap.get(key)
          if (isShop) {
            ex.storeStock = (ex.storeStock || 0) + it.stock
            if (!ex.sellingPrice && it.sellingPrice) ex.sellingPrice = it.sellingPrice
            if (!ex.sellingPriceRange && it.sellingPriceRange) ex.sellingPriceRange = it.sellingPriceRange
            if (!ex.costPrice && it.costPrice) ex.costPrice = it.costPrice
          } else {
            ex.warehouseStock = (ex.warehouseStock || 0) + it.stock
          }
        } else {
          mergedMap.set(key, {
            code: it.code,
            name: it.name,
            category: it.category,
            unit: it.unit,
            costPrice: it.costPrice,
            sellingPrice: it.sellingPrice,
            sellingPriceRange: it.sellingPriceRange,
            minStockThreshold: it.minStockThreshold,
            warehouseStock: isShop ? undefined : it.stock,
            storeStock: isShop ? it.stock : undefined,
          })
        }
      }
    }
  } else {
    // Single sheet or standard workbook
    const primarySheetName = sheetNames[0]
    const items = parsedSheets[primarySheetName] || []

    for (const it of items) {
      const key = (it.code || it.name).toLowerCase().trim()
      mergedMap.set(key, {
        code: it.code,
        name: it.name,
        category: it.category,
        unit: it.unit,
        costPrice: it.costPrice,
        sellingPrice: it.sellingPrice,
        sellingPriceRange: it.sellingPriceRange,
        minStockThreshold: it.minStockThreshold,
        warehouseStock: Math.floor(it.stock * 0.4),
        storeStock: Math.ceil(it.stock * 0.6),
      })
    }
  }

  const finalItems = Array.from(mergedMap.values()).map((it) => {
    const isOil = ((it.name || '') + ' ' + (it.category || '')).toLowerCase().includes('oil')
    it.defaultCommissionRate = isOil ? 0.5 : 2.5
    return it
  })

  const totalWhUnits = finalItems.reduce((acc, it) => acc + (it.warehouseStock || 0), 0)
  const totalStUnits = finalItems.reduce((acc, it) => acc + (it.storeStock || 0), 0)

  return {
    fileName,
    sheetsDetected: sheetNames,
    items: finalItems,
    summary: {
      totalProducts: finalItems.length,
      warehouseUnits: totalWhUnits,
      storeUnits: totalStUnits,
      oilProductsCount: finalItems.filter((it) => it.defaultCommissionRate === 0.5).length,
    }
  }
}
