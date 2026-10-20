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
- Organizer discount codes: a "Generuj partię" dialog creates up to 1000 unique
  codes at once (prefix, value, usage limit, validity), lists the batches and
  downloads each one as a CSV.

[Unreleased]: https://github.com/Aberratio/eventflow-platform/commits/main
