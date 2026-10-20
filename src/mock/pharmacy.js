export const mockDrugs = [
  { id: 1,  name: 'Paracetamol 500mg',      category: 'Analgesic',     stock_qty: 500, unit: 'tablets',  expiry: '2027-12-31', location: 'Pharmacy' },
  { id: 2,  name: 'Amoxicillin 250mg',      category: 'Antibiotic',    stock_qty: 200, unit: 'capsules', expiry: '2027-06-30', location: 'Pharmacy' },
  { id: 3,  name: 'Metronidazole 400mg',    category: 'Antibiotic',    stock_qty: 150, unit: 'tablets',  expiry: '2027-09-30', location: 'Pharmacy' },
  { id: 4,  name: 'ORS Sachets',            category: 'Rehydration',   stock_qty: 80,  unit: 'sachets',  expiry: '2026-12-31', location: 'Pharmacy' },
  { id: 5,  name: 'Diclofenac 50mg',        category: 'Analgesic',     stock_qty: 300, unit: 'tablets',  expiry: '2028-03-31', location: 'Pharmacy' },
  { id: 6,  name: 'Coartem (AL)',           category: 'Antimalarial',  stock_qty: 60,  unit: 'tabs',     expiry: '2026-11-30', location: 'Pharmacy' },
  { id: 7,  name: 'Gentamicin Injection',   category: 'Antibiotic',    stock_qty: 40,  unit: 'vials',    expiry: '2027-01-31', location: 'Injection Room' },
  { id: 8,  name: 'Diazepam Injection 5mg', category: 'Sedative',      stock_qty: 20,  unit: 'ampoules', expiry: '2027-04-30', location: 'Injection Room' },
  { id: 9,  name: 'IV Normal Saline 1L',    category: 'IV Fluid',      stock_qty: 25,  unit: 'bags',     expiry: '2027-08-31', location: 'Injection Room' },
  { id: 10, name: 'Surgical Gloves (M)',    category: 'Equipment',     stock_qty: 8,   unit: 'pairs',    expiry: null,         location: 'Pharmacy' },
]

export const mockInjectionOrders = [
  {
    id: 1,
    order_no: 'INJ-2026-001',
    patient_name: 'Brian Mugisha',
    patient_type: 'student',
    drug: 'Gentamicin 80mg IV',
    dose: '80mg',
    route: 'Intravenous',
    doctor: 'Demo Doctor',
    status: 'pending',
    time: '2026-06-22T08:30:00Z',
  },
  {
    id: 2,
    order_no: 'INJ-2026-002',
    patient_name: 'Grace Atim',
    patient_type: 'staff',
    drug: 'Diazepam 5mg IM',
    dose: '5mg',
    route: 'Intramuscular',
    doctor: 'Demo Doctor',
    status: 'pending',
    time: '2026-06-22T09:15:00Z',
  },
  {
    id: 3,
    order_no: 'INJ-2026-003',
    patient_name: 'Demo Student One',
    patient_type: 'student',
    drug: 'IV Normal Saline 1L',
    dose: '1000ml',
    route: 'Intravenous drip',
    doctor: 'Demo Doctor',
    status: 'done',
    time: '2026-06-22T07:00:00Z',
  },
]

export const mockPrescriptions = [
  {
    id: 1,
    prescription_no: 'RX-2026-001',
    patient_name: 'Demo Student One',
    doctor: 'Demo Doctor',
    visit_id: 1,
    status: 'pending',
    created_at: '2026-06-22T09:45:00Z',
    items: [
      { id: 1, drug_name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Three times daily', duration: '3 days', quantity: 9 },
      { id: 2, drug_name: 'Coartem (AL)',       dosage: '4 tablets', frequency: 'Twice daily',      duration: '3 days', quantity: 24 },
    ],
  },
]
