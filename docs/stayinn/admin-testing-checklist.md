# Admin Testing Checklist

## Authentication and access

- [ ] Login as platform admin succeeds.
- [ ] Non-admin cannot access `/admin/(panel)` routes.
- [ ] Inactive admin profile is redirected from panel.

## Owners CRUD (implemented)

- [ ] Search owner by business/contact/phone/email.
- [ ] Filter owners by status.
- [ ] Edit owner basic details and verify persisted values.
- [ ] Approve owner and verify `approved_at`/`approved_by` updated.
- [ ] Reject owner requires remarks and persists audit fields.
- [ ] Suspend owner requires remarks and persists audit fields.
- [ ] Delete owner with no dependent records succeeds.
- [ ] Delete owner with dependent records shows friendly failure.

## Backlog CRUD flows (not completed in this iteration)

- [ ] Property CRUD and moderation actions.
- [ ] Room CRUD and status actions.
- [ ] Booking status, payment, charge CRUD.
- [ ] State/district/location CRUD.
- [ ] Platform settings CRUD with array editor.
