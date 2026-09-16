# Roadmap

- [x] Voice Attendance: attendance table, matching lib, attendance route, voice + manual modes, class summary, student history, i18n hi/kn
- [ ] Multi-tenant school-code model (.lovable/plan.md)
  - [ ] Phase 1: additive migration (grade/section, school_id backfill, NOT NULL, verification abort)
  - [ ] Phase 1b: RLS helpers get_user_school_id/get_user_class + verify_school_code RPC + student write policies
  - [ ] Phase 2: signup with school code, grade, section; profile context
  - [ ] Phase 3: roster route + manual add + CSV import with preview/validation
  - [ ] Phase 4: demote demo personas, static sample classroom at /preview
  - [ ] i18n en/hi/kn for all new strings
  - [ ] Verify counts (110 students / 1326 noticings), publish
