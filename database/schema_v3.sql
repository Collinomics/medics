-- MCIS schema v3 - canonical implementation target
-- MySQL 8+. Use migrations in the backend backend; this file documents the final model.

CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
);

CREATE TABLE persons (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_type ENUM('student','staff','dependent','other') NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  gender ENUM('male','female','other','prefer_not_to_say') NULL,
  date_of_birth DATE NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  address TEXT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown') NULL,
  registration_number VARCHAR(60) NULL UNIQUE,
  student_number VARCHAR(60) NULL UNIQUE,
  staff_number VARCHAR(60) NULL UNIQUE,
  faculty VARCHAR(150) NULL,
  course VARCHAR(150) NULL,
  year_of_entry SMALLINT UNSIGNED NULL,
  year_of_study TINYINT UNSIGNED NULL,
  course_duration TINYINT UNSIGNED NULL,
  position VARCHAR(100) NULL,
  department_id BIGINT UNSIGNED NULL,
  dependant_of_person_id BIGINT UNSIGNED NULL,
  chronic_conditions TEXT NULL,
  hospitalisation_history TEXT NULL,
  known_allergies TEXT NULL,
  next_of_kin_name VARCHAR(160) NULL,
  next_of_kin_relationship VARCHAR(80) NULL,
  next_of_kin_phone VARCHAR(30) NULL,
  photo_path VARCHAR(255) NULL,
  verification_status ENUM('pending_verification','approved','rejected') NOT NULL DEFAULT 'pending_verification',
  verification_notes TEXT NULL,
  verified_by BIGINT UNSIGNED NULL,
  verified_at TIMESTAMP NULL,
  medical_card_number VARCHAR(60) NULL UNIQUE,
  medical_card_issued_at DATE NULL,
  medical_card_expires_at DATE NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  INDEX idx_person_name (last_name, first_name),
  INDEX idx_person_type (person_type),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (dependant_of_person_id) REFERENCES persons(id) ON DELETE SET NULL
);

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT UNSIGNED NULL UNIQUE,
  department_id BIGINT UNSIGNED NULL,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(150) NULL UNIQUE,
  role ENUM('admin','reception','doctor','lab','pharmacy','injection','dental','student','staff','dependent') NOT NULL,
  status ENUM('pending','active','inactive','locked') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (person_id) REFERENCES persons(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

ALTER TABLE persons ADD CONSTRAINT fk_person_verified_by
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_number VARCHAR(30) NOT NULL UNIQUE,
  queue_number VARCHAR(15) NOT NULL,
  person_id BIGINT UNSIGNED NOT NULL,
  receptionist_id BIGINT UNSIGNED NULL,
  doctor_id BIGINT UNSIGNED NULL,
  temperature DECIMAL(4,1) NULL,
  blood_pressure VARCHAR(20) NULL,
  weight DECIMAL(5,2) NULL,
  symptoms TEXT NULL,
  status ENUM('waiting','in_consultation','awaiting_services','ready_for_review','completed','discharged','cancelled') NOT NULL DEFAULT 'waiting',
  disposition ENUM('return_to_doctor','discharge_when_services_complete','admit','refer_external') NULL,
  cancellation_reason TEXT NULL,
  started_at TIMESTAMP NULL, completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  INDEX idx_visit_queue (created_at, status, queue_number),
  FOREIGN KEY (person_id) REFERENCES persons(id),
  FOREIGN KEY (receptionist_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE consultations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_id BIGINT UNSIGNED NOT NULL,
  doctor_id BIGINT UNSIGNED NOT NULL,
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

CREATE TABLE lab_tests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
);

CREATE TABLE lab_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_number VARCHAR(30) NOT NULL UNIQUE,
  visit_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE lab_request_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lab_request_id BIGINT UNSIGNED NOT NULL,
  lab_test_id BIGINT UNSIGNED NOT NULL,
  result TEXT NULL, remarks TEXT NULL,
  status ENUM('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  tested_by BIGINT UNSIGNED NULL, tested_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_request_test (lab_request_id, lab_test_id),
  FOREIGN KEY (lab_request_id) REFERENCES lab_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_test_id) REFERENCES lab_tests(id),
  FOREIGN KEY (tested_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE drugs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(80) NULL,
  unit VARCHAR(30) NOT NULL,
  location ENUM('pharmacy','injection_room','other') NOT NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  reorder_level INT UNSIGNED NOT NULL DEFAULT 20,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
);

CREATE TABLE drug_batches (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  batch_number VARCHAR(80) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  expiry_date DATE NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY uq_drug_batch (drug_id, batch_number),
  FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

CREATE TABLE prescriptions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_number VARCHAR(30) NOT NULL UNIQUE,
  visit_id BIGINT UNSIGNED NOT NULL,
  doctor_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pending','partially_dispensed','dispensed','cancelled') NOT NULL DEFAULT 'pending',
  dispensed_by BIGINT UNSIGNED NULL, dispensed_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES users(id),
  FOREIGN KEY (dispensed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE prescription_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  prescription_id BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NOT NULL,
  dosage VARCHAR(80) NOT NULL, frequency VARCHAR(80) NOT NULL,
  duration VARCHAR(80) NOT NULL,
  quantity_prescribed INT UNSIGNED NOT NULL,
  quantity_dispensed INT UNSIGNED NOT NULL DEFAULT 0,
  dispensing_notes TEXT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (drug_id) REFERENCES drugs(id)
);

CREATE TABLE injection_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  visit_id BIGINT UNSIGNED NOT NULL,
  ordered_by BIGINT UNSIGNED NOT NULL,
  drug_id BIGINT UNSIGNED NULL,
  drug_name VARCHAR(140) NOT NULL,
  dose VARCHAR(80) NOT NULL, administration_route VARCHAR(80) NOT NULL,
  instructions TEXT NULL,
  status ENUM('pending','administered','forwarded_to_pharmacy','cancelled') NOT NULL DEFAULT 'pending',
  administered_by BIGINT UNSIGNED NULL, administered_at TIMESTAMP NULL,
  outcome_notes TEXT NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (ordered_by) REFERENCES users(id),
  FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE SET NULL,
  FOREIGN KEY (administered_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE referrals (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_id BIGINT UNSIGNED NOT NULL,
  referred_by BIGINT UNSIGNED NOT NULL,
  destination ENUM('dental','external_facility','other') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  completed_by BIGINT UNSIGNED NULL, outcome TEXT NULL, completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_by) REFERENCES users(id),
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE stock_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  drug_id BIGINT UNSIGNED NOT NULL,
  drug_batch_id BIGINT UNSIGNED NULL,
  transaction_type ENUM('received','dispensed','administered','expired','adjustment') NOT NULL,
  quantity_change INT NOT NULL,
  reference_type VARCHAR(60) NULL, reference_id BIGINT UNSIGNED NULL,
  performed_by BIGINT UNSIGNED NOT NULL, notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drug_id) REFERENCES drugs(id),
  FOREIGN KEY (drug_batch_id) REFERENCES drug_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE TABLE notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(160) NOT NULL, message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  read_at TIMESTAMP NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  subject_type VARCHAR(100) NOT NULL, subject_id BIGINT UNSIGNED NULL,
  old_values JSON NULL, new_values JSON NULL,
  ip_address VARCHAR(45) NULL, user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_subject (subject_type, subject_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

