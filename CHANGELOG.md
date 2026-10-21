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

- Mobile fixes: the Tickets tab no longer breaks on a missing event date,
  and organizer and admin tabs no longer overflow the page at 360 px.

- Public event catalogue with event details, live results, series and
  challenges.
- Caregivers and organizers can report a possible duplicate competitor
  profile; moderators and admins review the reports in a queue with a status
  filter and can reject them with a reason.
- Event registration, including an embeddable registration form for
  organizers' own websites, and confirmation pages.
- Inter fonts are served from the platform's own domain, so no request goes
  to Google before cookie consent.
- Registration form per distance: in the form editor, organizers pick the
  whole event or one distance, see inherited fields, override them for that
  distance (or reset), and add distance-only fields. The registration form
  shows the form of the chosen distance.
- The embedded registration form shows the price calculated by the server,
  like the main registration page.
- Results tables show the place by gender next to the open and category places.
- Shop with product pages, cart and order confirmation.
- Escape closes the mobile menu and returns focus to the menu button.
- Accounts: sign-up, login, password reset, e-mail verification and e-mail
  change, a profile page and public athlete profiles.
- Accessibility: a "skip to content" link, a single main landmark per page
  and a consistent heading hierarchy.
- Login shows how long to wait ("Zbyt wiele nieudanych prób logowania...")
  and disables the button when the server temporarily blocks further
  attempts after repeated failures.
- Participant dashboard with printable tickets and team invitations for
  captains.
- The participant dashboard no longer shows the non-working Messages tab,
  and the organizer's placeholder "Message" button is gone.
- Organizer, moderator and admin panels for running events, registrations,
  results and the shop.
- Accessibility: form fields, filters and icon buttons have accessible
  names, and the show-password toggle is a larger touch target.
- Info pages, and dedicated error pages for missing pages, forbidden access,
  server errors and maintenance.
- Accessibility: a visible keyboard focus everywhere, cookie settings as a
  proper modal dialog, and keyboard-reachable scrollable tables and drawers.
- The footer shows the running version, or the commit for a deploy that is
  not a release.
- Accessibility: text colours meet the 4.5:1 contrast ratio.
- Organizer discount codes: a "Generuj partię" dialog creates up to 1000 unique
  codes at once (prefix, value, usage limit, validity), lists the batches and
  downloads each one as a CSV.
- Admin panel: "Rozliczenia (trasa A)" settlement report for gateway payments,
  with period and event filters, per-event totals (payments, refunds,
  commission, amount to pay out), line items and CSV/XLSX export.
- Start number ranges per distance in the event form (overlapping ranges are
  flagged), a server-side "assign start numbers" action that fills each range,
  and manual start numbers that are checked for uniqueness and range.
- Participants can cancel their own registration from the dashboard until the
  organizer's cut-off date (zakres P2, do potwierdzenia przez Zamawiającego),
  see the registration history, and organizers set the "Samoobsługa zapisów"
  switch and cut-off date in the event form.
- "Zmień dystans" for a registration (zakres P2, do potwierdzenia przez
  Zamawiającego): participants pick another distance or fee variant inside the
  same self-service window, see the new price and the balance before
  confirming, and are told when a dearer distance has to be settled with the
  organizer; organizers can change the distance of any registration from the
  participants list. A cheaper distance files a refund request for the
  overpayment.

### Fixed

- Organizer participant actions (confirming a payment, cancelling a
  registration, cancelling selected or unpaid registrations and saving payment
  details) are now saved on the server and no longer disappear after a reload;
  errors show the server's message. The "Remove" and "Restore" actions, which
  had no server support, were removed.

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
