# Release Notes

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-11-25

### Added

- Initial release of **Ormezo Parking Dashboard**
- GitHub Actions CI/CD workflow (`ci.yml`) with:
  - Scheduled run every 5 minutes
  - HTML linting with `htmlhint`
  - CSS linting with `stylelint` (auto-fix)
  - Markdown linting with `markdownlint-cli` (auto-fix)
  - Snapshot generator (`extractor.js`)
  - Sanity check for `parking-status.json`
  - Commit and push of updated JSON snapshot
- GitHub Pages integration for dashboard publishing
- Community health files:
  - `CODE_OF_CONDUCT.md`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
  - `LICENSE.md` (MIT)
- README badges for CI, releases, license, contributing, and security policy

### Changed

- Streamlined workflow to run from repo root
- Added auto-fix for CSS and Markdown linting
- Improved commit step to stage only `parking-status.json`

### Fixed

- Corrected badge paths to use `dkg11hu/ormezo-parking`
- Resolved missing badge.svg issue by pointing to `ci.yml`

---

## [Unreleased]

### Planned

- Add unit tests and test badge
- Integrate coverage reporting (Codecov)
- Expand extractor to handle multiple parking sources
- Add GitHub Discussions welcome post
