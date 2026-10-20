# MCIS delivery phases

## Phase 1 - Foundation (complete)

- Confirm the clinical workflow and visit lifecycle.
- Define the canonical API contract and data names.
- Add the v3 database implementation target.
- Make frontend demo mode environment-controlled and visible.

## Phase 2 - Backend and authentication (complete)

- Create the Laravel API application and migrations.
- Implement token authentication and role middleware.
- Seed staff demo accounts and reference data.
- Implement registration, approval, and patient profile endpoints.

## Phase 3 - Reception and consultation (complete)

- Implement patient search, registration, triage, and daily queues.
- Implement atomic consultations, diagnoses, orders, and disposition.
- Update the frontend to use the canonical API response fields.

## Phase 4 - Laboratory, pharmacy, injection, and dental (complete)

- Complete each department queue and outcome workflow.
- Implement transactional stock movements and partial dispensing.
- Return visits to review or discharge them according to disposition.

## Phase 5 - Patient portal, reporting, and hardening (complete)

- Complete cards, photos, history, and notifications.
- Implement accurate reports and PDF export.
- Add automated workflow tests, security controls, backups, logging, and deployment configuration.
