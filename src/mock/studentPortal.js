export const mockStudentVisits = [
  {
    id: 1,
    visit_no: 'V-2026-0031',
    visit_date: '2026-05-14T09:20:00Z',
    doctor: 'Demo Doctor',
    diagnosis: 'Malaria',
    symptoms: 'Fever, headache, chills',
    prescription: 'Coartem 4 tabs BD x3 days, Paracetamol 1000mg TDS x3 days',
    referred_to: ['pharmacy'],
    status: 'completed',
  },
  {
    id: 2,
    visit_no: 'V-2026-0018',
    visit_date: '2026-03-02T11:05:00Z',
    doctor: 'Demo Doctor',
    diagnosis: 'URTI (Upper Respiratory Tract Infection)',
    symptoms: 'Sore throat, runny nose, mild fever',
    prescription: 'Amoxicillin 500mg TDS x5 days, Paracetamol 500mg TDS x3 days',
    referred_to: ['pharmacy'],
    status: 'completed',
  },
  {
    id: 3,
    visit_no: 'V-2026-0005',
    visit_date: '2026-01-20T08:45:00Z',
    doctor: 'Demo Doctor',
    diagnosis: 'Gastritis',
    symptoms: 'Stomach pain, nausea',
    prescription: 'Metronidazole 400mg TDS x5 days, ORS sachets',
    referred_to: ['pharmacy', 'lab'],
    status: 'completed',
  },
]

export const mockNotifications = [
  {
    id: 1,
    message: 'Your medical card has been issued. Card No: MC-2024-001',
    type: 'success',
    read: false,
    created_at: '2026-01-21T10:00:00Z',
  },
  {
    id: 2,
    message: 'Your lab results for Stool Analysis are ready. Visit the doctor to review.',
    type: 'info',
    read: false,
    created_at: '2026-01-20T14:30:00Z',
  },
  {
    id: 3,
    message: 'Prescription from your last visit has been dispensed.',
    type: 'info',
    read: true,
    created_at: '2026-01-20T12:00:00Z',
  },
]
