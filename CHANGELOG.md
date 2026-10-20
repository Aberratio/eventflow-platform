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
- Shop with product pages, cart and order confirmation.
- Accounts: sign-up, login, password reset, e-mail verification and e-mail
  change, a profile page and public athlete profiles.
- Participant dashboard with printable tickets and team invitations for
  captains.
- Organizer, moderator and admin panels for running events, registrations,
  results and the shop.
- Info pages, and dedicated error pages for missing pages, forbidden access,
  server errors and maintenance.
- The footer shows the running version, or the commit for a deploy that is
  not a release.
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
- "Przenieś zapis" in the organizer's participants list (zakres P2, do
  potwierdzenia przez Zamawiającego): move a registration to another
  competitor, found by name and date of birth or entered as a new person. The
  confirmation explains that the start code is rotated, the form answers are
  dropped and no money is settled between the two people.

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
