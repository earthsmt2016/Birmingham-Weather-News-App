# Copilot code review instructions

Act as a pragmatic second reviewer for a solo-maintained application. Prioritize
correctness, regressions, security, data integrity, accessibility, and behavior
that would affect a user in production.

Only leave a review comment when there is a concrete, high-confidence defect.
For every finding, explain the failure scenario and the expected behavior. Do
not report speculative concerns, subjective style preferences, formatting that
Prettier handles, or duplicates of another finding.

## Application-specific review priorities

- Preserve weather forecast semantics. Date and hour filtering must use the
  forecast data's source-local timestamp components consistently, and range
  endpoints must be inclusive.
- Verify that changing a weather selection clears dependent UI state so stale
  weather details cannot remain visible.
- Check React state changes for stale closures, out-of-range indexes, and
  mismatches after forecast data refreshes.
- Treat keyboard navigation, focus, and distinct accessible labels for
  interactive controls as functional requirements.
- Flag only meaningful performance issues on user-facing paths; avoid
  micro-optimizations unless they affect a realistic forecast data size.

If no meaningful issue is found, leave no inline comments. A concise summary
that the review found no blocking issues is sufficient.
