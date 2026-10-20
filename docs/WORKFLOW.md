# MCIS clinical workflow

This document is the source of truth for the Kyambogo University Medical Center Information System workflow.

## People and access

- A **person** is a student, university staff member, dependant, or other patient.
- A **user** is a login account. Staff users have clinical/administrative roles; a patient user is linked to one person.
- A person exists once and can have many clinic visits.
- Registration approval and medical-card issuance are separate from treatment. An unverified patient may be treated when reception records a reason, so urgent care is never blocked.

## Registration and medical card

1. A patient self-registers or reception registers them.
2. The registration starts as `pending_verification`.
3. An administrator approves or rejects it.
4. Approval assigns a unique medical-card number and activates the patient account.
5. Rejection stores a reason and allows corrected details to be submitted again.

## Visit lifecycle

The visit status describes the patient's overall episode, while orders and referrals describe parallel work.

`waiting -> in_consultation -> awaiting_services -> ready_for_review -> completed`

Alternative terminal states are `discharged` and `cancelled`.

- Reception creates the visit, captures triage, and places it in `waiting`.
- A doctor starts it, changing it to `in_consultation`.
- The doctor may diagnose and discharge immediately, or create one or more service orders.
- Outstanding lab, pharmacy, injection, or dental work changes the visit to `awaiting_services`.
- Each department completes its own order independently.
- When all required work is complete, the patient either returns to the doctor (`ready_for_review`) or is discharged according to the doctor's disposition.
- The final doctor review records the outcome and closes the visit.

## Department rules

### Laboratory

One lab request can contain multiple tests. Each test has its own result. Completing all tests completes the request and returns the visit for doctor review.

### Pharmacy

A prescription contains one or more items. Pharmacy may dispense an item fully, partially, substitute it with doctor approval, or mark it unavailable. Stock is reduced only by the quantity actually dispensed, inside the same database transaction.

### Injection room

The doctor creates a specific injection order containing the drug, dose, route, and instructions. The nurse records what was administered, by whom, and when. The patient can then return to the doctor or be discharged according to the order disposition.

### Dental

Dental is retained as a supported referral department. Until its clinical screen is implemented, the API and schema can record, assign, and complete dental referrals without losing the patient's trail.

## Audit and privacy

All clinical, identity, approval, stock, and account-status changes create audit entries. Medical data is exposed only to authenticated roles that require it. Audit entries are append-only.

