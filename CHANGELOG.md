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
- Caregivers and organizers can report a possible duplicate competitor
  profile; moderators and admins review the reports in a queue with a status
  filter and can reject them with a reason.
- Event registration, including an embeddable registration form for
  organizers' own websites, and confirmation pages.
- Inter fonts are served from the platform's own domain, so no request goes
  to Google before cookie consent.
- Shop with product pages, cart and order confirmation.
- Escape closes the mobile menu and returns focus to the menu button.
- Accounts: sign-up, login, password reset, e-mail verification and e-mail
  change, a profile page and public athlete profiles.
- Accessibility: a "skip to content" link, a single main landmark per page
  and a consistent heading hierarchy.
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

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
