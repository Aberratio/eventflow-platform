# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versions follow [calendar versioning](https://calver.org/)
(`YYYY.MM.PATCH`). See [RELEASING.md](RELEASING.md) for how a version is cut
and deployed.

## [Unreleased]

Not yet released to production. The first production deploy will be tagged
as the first version.

### Added

- Public event catalogue with event details, live results, series and
  challenges.
- Event registration, including an embeddable registration form for
  organizers' own websites, and confirmation pages.
- Registration form per distance: in the form editor, organizers pick the
  whole event or one distance, see inherited fields, override them for that
  distance (or reset), and add distance-only fields. The registration form
  shows the form of the chosen distance.
- Shop with product pages, cart and order confirmation.
- Accounts: sign-up, login, password reset, e-mail verification and e-mail
  change, a profile page and public athlete profiles.
- Participant dashboard with printable tickets and team invitations for
  captains.
- Organizer, moderator and admin panels for running events, registrations,
  results and the shop.
- Caregivers and organizers can report a possible duplicate competitor
  profile; moderators and admins review the reports in a queue with a status
  filter and can reject them with a reason.
- Organizer discount codes: a batch dialog (Polish label "Generuj partię")
  creates up to 1000 unique codes at once (prefix, value, usage limit,
  validity), lists the batches and downloads each one as a CSV.
- Admin settlement report for gateway payments (Polish label "Rozliczenia
  (trasa A)") with period and event filters, per-event totals (payments,
  refunds, commission, amount to pay out), line items and CSV/XLSX export.
- Info pages, and dedicated error pages for missing pages, forbidden access,
  server errors and maintenance.
- The footer shows the running version, or the commit for a deploy that is
  not a release.
- Accessibility: a "skip to content" link, a single main landmark per page,
  a consistent heading hierarchy, accessible names for form fields, filters
  and icon buttons, a visible keyboard focus everywhere, cookie settings as a
  proper modal dialog, keyboard-reachable scrollable tables and drawers,
  Escape closing the mobile menu and returning focus to its button, a larger
  touch target for the show-password toggle, and text colours that meet the
  4.5:1 contrast ratio.

### Changed

- Inter fonts are served from the platform's own domain, so no request goes
  to Google before cookie consent.

### Fixed

- Mobile: the Tickets tab no longer breaks on a missing event date, and
  organizer and admin tabs no longer overflow the page at 360 px.

### Removed

- The non-working Messages tab on the participant dashboard and the
  organizer's placeholder "Message" button.

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
