export const ROLES = {
  ADMIN:       'admin',
  RECEPTIONIST:'reception',
  DOCTOR:      'doctor',
  LAB:         'lab',
  INJECTION:   'injection',
  PHARMACIST:  'pharmacy',
  DENTAL:      'dental',
  RECORDS:     'records',
  STUDENT:     'student',
  STAFF:       'staff',
  DEPENDENT:   'dependent',
}

export const VISIT_STATUS = {
  WAITING:        'waiting',
  IN_CONSULTATION:'in_consultation',
  SENT_TO_LAB:    'sent_to_lab',
  SENT_TO_PHARMACY:'sent_to_pharmacy',
  SENT_TO_INJECTION:'sent_to_injection',
  SENT_TO_DENTAL: 'sent_to_dental',
  COMPLETED:      'completed',
  DISCHARGED:     'discharged',
}

export const CARD_STATUS = {
  PENDING: 'pending',
  ISSUED:  'issued',
}

export const PATIENT_TYPE = {
  STUDENT:   'student',
  STAFF:     'staff',
  DEPENDENT: 'dependent',
}

export const KYU_FACULTIES = [
  { id: 1, name: 'Faculty of Engineering' },
  { id: 2, name: 'Faculty of Computing and Informatics' },
  { id: 3, name: 'Faculty of Education' },
  { id: 4, name: 'Faculty of Health Sciences' },
  { id: 5, name: 'Faculty of Law' },
  { id: 6, name: 'Faculty of Science' },
  { id: 7, name: 'Faculty of Business and Management' },
  { id: 8, name: 'Faculty of Arts and Social Sciences' },
  { id: 9, name: 'School of Postgraduate Studies' },
]

export const KYU_COURSES = {
  1: [ // Engineering
    'Bachelor of Civil Engineering',
    'Bachelor of Electrical Engineering',
    'Bachelor of Mechanical Engineering',
    'Bachelor of Telecommunications Engineering',
    'Bachelor of Construction Engineering and Management',
    'Bachelor of Agricultural Engineering',
  ],
  2: [ // Computing and Informatics
    'Bachelor of Information Technology',
    'Bachelor of Computer Science',
    'Bachelor of Information Systems',
    'Bachelor of Software Engineering',
    'Bachelor of Data Science and Artificial Intelligence',
    'Bachelor of Cybersecurity',
  ],
  3: [ // Education
    'Bachelor of Education (Arts)',
    'Bachelor of Education (Science)',
    'Bachelor of Early Childhood and Primary Education',
    'Bachelor of Special Needs and Rehabilitation Education',
    'Bachelor of Physical Education and Sports',
    'Bachelor of Adult and Community Education',
  ],
  4: [ // Health Sciences
    'Bachelor of Physiotherapy',
    'Bachelor of Environmental Health Science',
    'Bachelor of Nursing Science',
    'Bachelor of Medical Laboratory Science',
    'Bachelor of Biomedical Engineering',
    'Bachelor of Public Health',
    'Bachelor of Radiography',
  ],
  5: [ // Law
    'Bachelor of Laws (LLB)',
  ],
  6: [ // Science
    'Bachelor of Science (Biology)',
    'Bachelor of Science (Chemistry)',
    'Bachelor of Science (Mathematics)',
    'Bachelor of Science (Physics)',
    'Bachelor of Industrial and Applied Chemistry',
    'Bachelor of Statistics',
  ],
  7: [ // Business and Management
    'Bachelor of Business Administration',
    'Bachelor of Commerce',
    'Bachelor of Procurement and Supply Chain Management',
    'Bachelor of Accounting and Finance',
    'Bachelor of Human Resource Management',
    'Bachelor of Entrepreneurship and Small Business Management',
  ],
  8: [ // Arts and Social Sciences
    'Bachelor of Arts (Social Sciences)',
    'Bachelor of Mass Communication and Journalism',
    'Bachelor of Guidance and Counselling',
    'Bachelor of Sociology',
    'Bachelor of Development Studies',
    'Bachelor of Languages and Linguistics',
  ],
  9: [ // Postgraduate
    'Master of Science in Information Technology',
    'Master of Business Administration (MBA)',
    'Master of Education',
    'Master of Engineering',
    'Master of Laws (LLM)',
    'Master of Public Health',
    'Doctor of Philosophy (PhD)',
  ],
}
