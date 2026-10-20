-- ============================================
-- MCIS - Medical Center Information System
-- Kyambogo University Medical Center
-- ============================================
--
-- Schema v2 — updated by frontend lead
-- Changes from v1:
--   1. persons      : added faculty, course, year_of_study, medical_card_no, medical_card_status
--   2. visits       : added visit_no, queue_no, receptionist_id; aligned status ENUM with frontend
--   3. drugs        : added category, unit, location
--   4. prescriptions: added prescription_no, status
--   5. lab_requests : added request_no
--   6. NEW TABLE    : injection_orders (doctor-ordered injections, separate from oral prescriptions)
--   7. Sample data  : expanded to reflect real KYU Medical Center workflow
-- ============================================


-- ============================================
-- CREATE TABLES (No DROP, No warnings)
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
    dept_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    dept_name  VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff / system users only (doctors, nurses, reception, admin, etc.)
-- Patients (students/staff/other) are stored in the persons table instead
-- Role values: admin | reception | doctor | lab | pharmacy | injection
CREATE TABLE IF NOT EXISTS users (
    user_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','reception','doctor','lab','pharmacy','injection') NOT NULL,
    full_name     VARCHAR(100) NULL,
    email         VARCHAR(100) NULL,
    status        ENUM('active','inactive') DEFAULT 'active',
    dept_id       BIGINT UNSIGNED NULL,
    created_at    TIMESTAMP NULL DEFAULT NULL,
    updated_at    TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patients: students, university staff, and other walk-ins
-- faculty, course, year_of_study are only filled for students
-- staff_number and position are only filled for university staff
CREATE TABLE IF NOT EXISTS persons (
    person_id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name          VARCHAR(100) NOT NULL,
    gender             ENUM('M','F') NULL,
    date_of_birth      DATE NULL,
    age                INT NULL,              -- stored for convenience; compute from date_of_birth where possible
    phone              VARCHAR(20)  NULL,
    email              VARCHAR(100) NULL,
    address            TEXT NULL,
    person_type        ENUM('student','staff','other') NOT NULL,

    -- Student-specific fields
    student_id         VARCHAR(50)  NULL UNIQUE,
    faculty            VARCHAR(150) NULL,
    course             VARCHAR(150) NULL,
    year_of_study      TINYINT UNSIGNED NULL,

    -- University staff-specific fields
    staff_number       VARCHAR(50)  NULL UNIQUE,
    position           VARCHAR(100) NULL,
    dept_id            BIGINT UNSIGNED NULL,

    -- Medical card (issued at reception on first visit)
    medical_card_no     VARCHAR(50)  NULL UNIQUE,
    medical_card_status ENUM('pending','issued') NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per clinic visit
-- visit_no  : human-readable reference shown on documents e.g. V-2026-0041
-- queue_no  : daily queue number displayed on the waiting screen e.g. Q041
-- status flow: waiting → in_consultation → sent_to_lab / sent_to_pharmacy / sent_to_injection → completed / discharged
CREATE TABLE IF NOT EXISTS visits (
    visit_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visit_no         VARCHAR(20)  NULL,
    queue_no         VARCHAR(10)  NULL,
    person_id        BIGINT UNSIGNED NOT NULL,
    receptionist_id  BIGINT UNSIGNED NULL,    -- reception staff who registered this visit
    doctor_id        BIGINT UNSIGNED NULL,
    visit_date       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    temperature      DECIMAL(4,1) NULL,
    blood_pressure   VARCHAR(20)  NULL,
    weight           DECIMAL(5,2) NULL,
    symptoms         TEXT NULL,
    status           ENUM(
                         'waiting',           -- registered, waiting to see doctor
                         'in_consultation',   -- currently with doctor
                         'sent_to_lab',       -- doctor sent patient for lab tests
                         'lab_done',          -- lab results back, patient returns to doctor
                         'sent_to_pharmacy',  -- doctor issued prescription
                         'sent_to_injection', -- doctor ordered injection
                         'completed',         -- all steps done, patient discharged
                         'discharged'         -- explicitly discharged without full workflow
                     ) DEFAULT 'waiting',
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (person_id)       REFERENCES persons(person_id) ON DELETE CASCADE,
    FOREIGN KEY (receptionist_id) REFERENCES users(user_id)    ON DELETE SET NULL,
    FOREIGN KEY (doctor_id)       REFERENCES users(user_id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diagnoses (
    diagnosis_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    visit_id     BIGINT UNSIGNED NOT NULL,
    diagnosis    TEXT NOT NULL,
    notes        TEXT NULL,
    created_at   TIMESTAMP NULL DEFAULT NULL,
    updated_at   TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (visit_id) REFERENCES visits(visit_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lab_tests (
    test_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    test_name   VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at  TIMESTAMP NULL DEFAULT NULL,
    updated_at  TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One lab_request groups one or more tests ordered for a single visit
-- request_no : human-readable reference e.g. LR-2026-001
CREATE TABLE IF NOT EXISTS lab_requests (
    lab_request_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_no     VARCHAR(20) NULL,
    visit_id       BIGINT UNSIGNED NOT NULL,
    requested_by   BIGINT UNSIGNED NULL,      -- doctor who ordered the tests
    request_date   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    status         ENUM('pending','in_progress','completed') DEFAULT 'pending',
    created_at     TIMESTAMP NULL DEFAULT NULL,
    updated_at     TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (visit_id)     REFERENCES visits(visit_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(user_id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per individual test result within a lab request
CREATE TABLE IF NOT EXISTS lab_results (
    result_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lab_request_id BIGINT UNSIGNED NOT NULL,
    test_id        BIGINT UNSIGNED NOT NULL,
    result         TEXT NULL,
    remarks        TEXT NULL,
    tested_by      BIGINT UNSIGNED NULL,
    test_date      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at     TIMESTAMP NULL DEFAULT NULL,
    updated_at     TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (lab_request_id) REFERENCES lab_requests(lab_request_id) ON DELETE CASCADE,
    FOREIGN KEY (test_id)        REFERENCES lab_tests(test_id),
    FOREIGN KEY (tested_by)      REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- category : e.g. Analgesic, Antibiotic, Antimalarial, IV Fluid, Equipment
-- unit     : tablets, capsules, vials, bags, sachets, ampoules, pairs, etc.
-- location : where the item is physically stored
CREATE TABLE IF NOT EXISTS drugs (
    drug_id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drug_name         VARCHAR(100) NOT NULL,
    description       TEXT NULL,
    category          VARCHAR(50)  NULL,
    unit              VARCHAR(30)  NULL DEFAULT 'tablets',
    location          ENUM('Pharmacy','Injection Room','Other') NOT NULL DEFAULT 'Pharmacy',
    quantity_in_stock INT NOT NULL DEFAULT 0,
    expiry_date       DATE NULL,
    created_at        TIMESTAMP NULL DEFAULT NULL,
    updated_at        TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- prescription_no : human-readable reference e.g. RX-2026-001
-- status          : pending (not yet dispensed) | dispensed
CREATE TABLE IF NOT EXISTS prescriptions (
    prescription_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_no   VARCHAR(20) NULL,
    visit_id          BIGINT UNSIGNED NOT NULL,
    doctor_id         BIGINT UNSIGNED NULL,
    status            ENUM('pending','dispensed') NOT NULL DEFAULT 'pending',
    prescription_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at        TIMESTAMP NULL DEFAULT NULL,
    updated_at        TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (visit_id)  REFERENCES visits(visit_id)  ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescription_items (
    item_id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT UNSIGNED NOT NULL,
    drug_id         BIGINT UNSIGNED NOT NULL,
    dosage          VARCHAR(50) NULL,
    frequency       VARCHAR(50) NULL,
    duration        VARCHAR(50) NULL,
    quantity        INT NOT NULL,
    created_at      TIMESTAMP NULL DEFAULT NULL,
    updated_at      TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id)         REFERENCES drugs(drug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispensing (
    dispense_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT UNSIGNED NOT NULL,
    dispensed_by    BIGINT UNSIGNED NULL,
    dispense_date   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    route           ENUM('oral','injection','topical','other') NOT NULL DEFAULT 'oral',
    remarks         TEXT NULL,
    created_at      TIMESTAMP NULL DEFAULT NULL,
    updated_at      TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE,
    FOREIGN KEY (dispensed_by)    REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Injection orders are created by the doctor and fulfilled by the injection room nurse.
-- They are separate from oral prescriptions because the workflow is different:
-- doctor writes the order → nurse administers it at the bedside / injection room.
-- order_no : human-readable reference e.g. INJ-2026-001
-- status   : pending (not yet given) | administered | forwarded_to_pharmacy (if drug not in stock)
CREATE TABLE IF NOT EXISTS injection_orders (
    order_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_no        VARCHAR(20) NULL,
    visit_id        BIGINT UNSIGNED NOT NULL,
    ordered_by      BIGINT UNSIGNED NULL,     -- doctor
    drug_id         BIGINT UNSIGNED NULL,
    dose            VARCHAR(50)  NULL,        -- e.g. 80mg
    route           VARCHAR(50)  NULL,        -- e.g. Intravenous, Intramuscular
    notes           TEXT NULL,
    status          ENUM('pending','administered','forwarded_to_pharmacy') NOT NULL DEFAULT 'pending',
    administered_by BIGINT UNSIGNED NULL,     -- injection nurse
    administered_at TIMESTAMP NULL DEFAULT NULL,
    created_at      TIMESTAMP NULL DEFAULT NULL,
    updated_at      TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (visit_id)        REFERENCES visits(visit_id) ON DELETE CASCADE,
    FOREIGN KEY (ordered_by)      REFERENCES users(user_id)  ON DELETE SET NULL,
    FOREIGN KEY (drug_id)         REFERENCES drugs(drug_id)  ON DELETE SET NULL,
    FOREIGN KEY (administered_by) REFERENCES users(user_id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_transactions (
    transaction_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    drug_id          BIGINT UNSIGNED NOT NULL,
    transaction_type ENUM('in','out','expired','adjustment') NOT NULL,
    quantity         INT NOT NULL,
    performed_by     BIGINT UNSIGNED NULL,
    remarks          TEXT NULL,
    transaction_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at       TIMESTAMP NULL DEFAULT NULL,
    updated_at       TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (drug_id)      REFERENCES drugs(drug_id),
    FOREIGN KEY (performed_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_records (
    record_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    person_id   BIGINT UNSIGNED NOT NULL,
    visit_id    BIGINT UNSIGNED NOT NULL,
    summary     TEXT NULL,
    recorded_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at  TIMESTAMP NULL DEFAULT NULL,
    updated_at  TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE CASCADE,
    FOREIGN KEY (visit_id)  REFERENCES visits(visit_id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================
-- SAMPLE DATA (So you have something to see)
-- ============================================

INSERT INTO departments (dept_name) VALUES
('Administration'),
('Outpatient / Consultation'),
('Laboratory'),
('Pharmacy'),
('Injection Room');

-- Default password for all sample users is: password
INSERT INTO users (username, password_hash, role, full_name, email, dept_id) VALUES
('admin',      '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',     'Admin User',      'admin@kyu-medcenter.ac.ug',     1),
('reception1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'reception', 'Demo Receptionist',     'reception@kyu-medcenter.ac.ug', 2),
('doctor1',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor',    'Demo Doctor', 'doctor@kyu-medcenter.ac.ug',    2),
('lab1',       '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lab',       'Demo Lab Officer',     'lab@kyu-medcenter.ac.ug',       3),
('pharmacy1',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'pharmacy',  'Demo Pharmacist',      'pharmacy@kyu-medcenter.ac.ug',  4),
('injection1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'injection', 'Demo Injection Nurse',      'injection@kyu-medcenter.ac.ug', 5);

INSERT INTO lab_tests (test_name, description) VALUES
('Full Blood Count (FBC)',      'Complete blood cell analysis — checks for anaemia, infection'),
('Malaria RDT',                 'Rapid diagnostic test for malaria parasites'),
('Blood Glucose (RBS)',         'Random blood sugar level'),
('Urinalysis',                  'Urine sample analysis — checks for infection, proteins, glucose'),
('Hepatitis B Surface Antigen', 'HBsAg screening'),
('HIV Rapid Test',              'HIV screening using rapid test kit'),
('Stool Analysis',              'Stool microscopy and culture for parasites and bacteria'),
('Widal Test',                  'Agglutination test for typhoid fever (Salmonella typhi)');

INSERT INTO drugs (drug_name, description, category, unit, location, quantity_in_stock, expiry_date) VALUES
('Paracetamol 500mg',      'Pain reliever and fever reducer',   'Analgesic',     'tablets',  'Pharmacy',       500, '2027-12-31'),
('Amoxicillin 250mg',      'Broad-spectrum antibiotic',         'Antibiotic',    'capsules', 'Pharmacy',       200, '2027-06-30'),
('Metronidazole 400mg',    'Antibiotic and antiprotozoal',      'Antibiotic',    'tablets',  'Pharmacy',       150, '2027-09-30'),
('ORS Sachets',            'Oral rehydration salts',            'Rehydration',   'sachets',  'Pharmacy',        80, '2026-12-31'),
('Diclofenac 50mg',        'Anti-inflammatory pain reliever',   'Analgesic',     'tablets',  'Pharmacy',       300, '2028-03-31'),
('Coartem (AL)',            'Artemether-lumefantrine for malaria','Antimalarial', 'tabs',     'Pharmacy',        60, '2026-11-30'),
('Gentamicin Injection',   'Aminoglycoside antibiotic, 80mg/2ml','Antibiotic',   'vials',    'Injection Room',  40, '2027-01-31'),
('Diazepam Injection 5mg', 'Benzodiazepine sedative/anticonvulsant','Sedative',  'ampoules', 'Injection Room',  20, '2027-04-30'),
('IV Normal Saline 1L',    '0.9% NaCl intravenous fluid',       'IV Fluid',      'bags',     'Injection Room',  25, '2027-08-31'),
('Surgical Gloves (M)',    'Sterile examination gloves, medium', 'Equipment',    'pairs',    'Pharmacy',         8, NULL);

-- Sample patients
INSERT INTO persons (full_name, gender, date_of_birth, age, phone, email, person_type, student_id, faculty, course, year_of_study, medical_card_no, medical_card_status) VALUES
('Demo Student One',  'F', '2002-03-14', 24, '0700000001', 'student1@example.test', 'student', 'DEMO-STU-001', 'Faculty of Computing and Informatics',  'Bachelor of Information Technology',      3, 'MC-2024-001', 'issued'),
('Demo Student Two','M','2001-07-22', 25, '0700000002', 'student2@example.test','student','DEMO-STU-002','Faculty of Engineering',               'Bachelor of Civil Engineering',           4, NULL,          'pending'),
('Demo Student Three','M','2003-09-11', 22, '0700000003', 'student3@example.test',  'student', 'DEMO-STU-003', 'Faculty of Science',                    'Bachelor of Science (Industrial Chemistry)',2,NULL,         'pending');

INSERT INTO persons (full_name, gender, date_of_birth, age, phone, email, person_type, staff_number, position, dept_id, medical_card_no, medical_card_status) VALUES
('Demo Staff Member', 'F', '1985-11-05', 41, '0700000004', 'staff1@example.test', 'staff', 'STAFF-0234', 'Lecturer', 1, 'MC-2024-003', 'issued');

-- Sample visit (person_id 1 = Demo Student One, receptionist_id 2 = Demo Receptionist, doctor_id 3 = Demo Doctor)
INSERT INTO visits (visit_no, queue_no, person_id, receptionist_id, doctor_id, temperature, blood_pressure, weight, symptoms, status) VALUES
('V-2026-0041', 'Q041', 1, 2, 3, 37.2, '120/80', 58.0, 'Headache and fever', 'in_consultation');

INSERT INTO diagnoses (visit_id, diagnosis, notes) VALUES
(1, 'Malaria (suspected)', 'Rapid test ordered. Patient advised rest and hydration.');

-- Lab request for the visit above
INSERT INTO lab_requests (request_no, visit_id, requested_by, status) VALUES
('LR-2026-001', 1, 3, 'pending');

-- Individual test within that request (test_id 2 = Malaria RDT)
INSERT INTO lab_results (lab_request_id, test_id, result, remarks, tested_by) VALUES
(1, 2, NULL, NULL, NULL);

-- Prescription for the same visit
INSERT INTO prescriptions (prescription_no, visit_id, doctor_id, status) VALUES
('RX-2026-001', 1, 3, 'pending');

INSERT INTO prescription_items (prescription_id, drug_id, dosage, frequency, duration, quantity) VALUES
(1, 1, '1 tablet',   'Every 8 hours', '3 days', 9),   -- Paracetamol 500mg
(1, 6, '4 tablets',  'Twice daily',   '3 days', 24);  -- Coartem (AL)

INSERT INTO stock_transactions (drug_id, transaction_type, quantity, performed_by, remarks) VALUES
(1, 'in', 500, 1, 'Initial stock — Paracetamol 500mg'),
(2, 'in', 200, 1, 'Initial stock — Amoxicillin 250mg'),
(6, 'in',  60, 1, 'Initial stock — Coartem (AL)'),
(7, 'in',  40, 1, 'Initial stock — Gentamicin Injection'),
(9, 'in',  25, 1, 'Initial stock — IV Normal Saline 1L');
