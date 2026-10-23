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
- Self-service for paid registrations: participants cancel their own
  registration until the organizer's cut-off date and see its history;
  inside the same window they can switch to another distance or fee variant
  after seeing the new price and the balance. Organizers set the switch and
  the cut-off date in the event form, change the distance of any
  registration, and move a registration to another competitor (the start
  code is rotated and no money is settled between the two people).
- Shop with product pages, cart and order confirmation.
- Accounts: sign-up, login, password reset, e-mail verification and e-mail
  change, a profile page and public athlete profiles.
- Participant dashboard with printable tickets and team invitations for
  captains; the challenges tab also lists the challenges of wards under care,
  and a caregiver can join a challenge on a ward's behalf.
- Organizer, moderator and admin panels for running events, registrations,
  results and the shop.
- Event team: the owner invites co-managers by e-mail, resends or revokes
  invitations and takes access away. Co-managed events appear in the
  organizer panel with a badge; owner-only actions (team, payments, deleting
  the event) stay hidden for co-managers.
- Start number ranges per distance in the event form, an "assign start
  numbers" action that fills each range, and manual start numbers checked for
  uniqueness and range.
- Caregivers and organizers can report a possible duplicate competitor
  profile; moderators and admins review the reports in a queue with a status
  filter and can reject them with a reason.
- Organizer discount codes: a batch dialog creates up to 1000 unique codes at
  once (prefix, value, usage limit, validity), lists the batches and
  downloads each one as a CSV.
- Admin settlement report for gateway payments with period and event
  filters, per-event totals (payments, refunds, commission, amount to pay
  out), line items and CSV/XLSX export.
- Results tables show the place by gender next to the open and category
  places.
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
- The embedded registration form shows the price calculated by the server,
  like the main registration page.
- Login tells the user how long to wait and disables the button when the
  server temporarily blocks further attempts after repeated failures.
- Notifications use one consistent style and position across the app.

### Fixed

- Results in pace mode no longer show impossible values such as "4:60 min/km".
- Mobile: the Tickets tab no longer breaks on a missing event date, and
  organizer and admin tabs no longer overflow the page at 360 px.
- Organizer participant actions (confirming a payment, cancelling single,
  selected or unpaid registrations, saving payment details and start numbers)
  are saved on the server and no longer disappear after a reload; errors show
  the server's message.
- My registrations: tapping "Poproś o zwrot" or "Ponów płatność" twice no
  longer sends a second request or opens a second payment; both buttons stay
  disabled until the first request finishes. A failed refund request now
  says why (for example that only a paid registration can be refunded)
  instead of always asking to try again later.

### Removed

- The non-working Messages tab on the participant dashboard and the
  organizer's placeholder "Message" button.
- The participants list "Remove" and "Restore" actions, which had no server
  support; cancelling a registration covers removing a participant.

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
