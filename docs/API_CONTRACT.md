# MCIS API contract

Base URL: `/api`. Successful responses use `{ "data": ... }`. Validation failures use status `422` and `{ "message": "...", "errors": { "field": ["..."] } }`.

Canonical identifiers are `id`, with related keys such as `person_id` and `visit_id`. API patient objects use `person_type`, `first_name`, `last_name`, `full_name`, `student_number`, `staff_number`, and `stock_quantity` consistently.

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Staff or patient login |
| POST | `/auth/register` | Patient self-registration |
| POST | `/auth/logout` | Revoke current token |
| GET | `/auth/me` | Current user and role |

## Patients and visits

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/patients` | List or register patients |
| GET/PUT | `/patients/{id}` | View or update a patient |
| GET | `/patients/search?q=` | Search canonical patient records |
| POST | `/visits` | Create triaged visit |
| GET | `/visits?date=today` | Reception and waiting-room queue |
| GET | `/visits/queue` | Doctor queue |
| GET | `/visits/history` | Filtered visit history |
| PUT/DELETE | `/visits/{id}` | Update or cancel a visit |
| POST | `/visits/{id}/start` | Begin consultation |
| POST | `/visits/{id}/consultation` | Atomically save diagnosis, orders, and disposition |
| POST | `/visits/{id}/complete` | Complete or discharge a visit |

`POST /visits/{id}/consultation` is the central clinical transaction. It accepts diagnosis, notes, prescriptions, lab requests, injection orders, referrals, and disposition together so a partial save cannot lose an order.

## Departments

| Method | Path | Purpose |
|---|---|---|
| GET | `/lab-tests` | Lab test catalogue |
| GET/POST | `/lab-requests` | Queue or create requests |
| PUT | `/lab-requests/{id}` | Enter/verify results |
| GET | `/drugs` | Drug catalogue and current stock |
| GET/POST | `/prescriptions` | Queue or create prescriptions |
| PUT | `/prescriptions/{id}/dispense` | Record item-level dispensing |
| GET/POST | `/injection-orders` | Queue or create injection orders |
| PUT | `/injection-orders/{id}/administer` | Record administration and disposition |
| GET/POST | `/referrals` | List or create general/dental referrals |
| PUT | `/referrals/{id}/complete` | Complete a referral |

## Patient portal and administration

| Method | Path | Purpose |
|---|---|---|
| GET/PUT | `/my/profile` | Patient profile |
| GET | `/my/visits` | Patient-visible history |
| GET | `/my/notifications` | Notifications |
| PUT | `/my/notifications/{id}/read` | Mark notification read |
| POST/DELETE | `/my/photo` | Upload or delete card photo |
| GET | `/admin/pending-registrations` | Verification queue |
| PUT | `/admin/pending-registrations/{id}/approve` | Approve and issue card |
| PUT | `/admin/pending-registrations/{id}/reject` | Reject with reason |
| GET/POST | `/admin/staff` | List or create staff |
| PUT | `/admin/staff/{id}` | Update staff |
| PUT | `/admin/staff/{id}/toggle-status` | Activate/deactivate staff |
| GET | `/admin/stats` | Dashboard totals |
| GET | `/records/drugs` | Inventory report |
| GET | `/records/trends` | Clinical and usage trends |
| GET | `/records/export` | Download report PDF |

