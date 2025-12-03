
# Őrmező Parking

[![CI](https://github.com/dkg11hu/ormezo-parking/actions/workflows/ci.yml/badge.svg)](https://github.com/dkg11hu/ormezo-parking/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green?logo=node.js)](https://nodejs.org/)
[![GitHub release](https://img.shields.io/github/v/release/dkg11hu/ormezo-parking?logo=github)](RELEASE_NOTES.md)
[![Semantic Versioning](https://img.shields.io/badge/semver-2.0.0-blue)](https://semver.org/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guide-green.svg)](CONTRIBUTING.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-green.svg)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Extractor and dashboard for monitoring Őrmező (Budapest) P+R parking availability.  
Built entirely with **JavaScript (Node.js)** and automated via GitHub Actions.

## Quickstart

```bash
git clone https://github.com/dkg11hu/ormezo-parking.git
cd ormezo-parking
npm install
make extract
make build
```

## Documents

- [CODE OF CONDUCT](CODE_OF_CONDUCT.md)
- [CONTRIBUTING](CONTRIBUTING.md)
- [SECURITY](SECURITY.md)
- [LICENCE](LICENCE)

## 💬 Community Support

We use [GitHub Discussions](https://github.com/dkg11hu/ormezo-parking/discussions) for Q&A, troubleshooting, and idea sharing.  
Please use Discussions instead of Issues for general questions or help requests.

## CI/CD

- Semantic versioning + GitHub Releases  
- Sanity checks for extractor/dashboard  
- Transparent deploy/test logging  

### Extract

```bash
make extract
```

Runs node extractor.js to refresh data in data.

### Build

```bash
make build
```

Produces _site/ and any bundled assets.

### Serve

```bash
node server.js
```

Starts the HTTP server for local preview.

## Runtime Flow

```text
Extractor → Parking Data → Dashboard → User
```

## 🌱 Community Health

This project follows open source best practices to ensure a safe, welcoming, and transparent environment for all contributors.

- 📜 [CODE OF CONDUCT](CODE_OF_CONDUCT.md) — Standards for respectful collaboration.
- 🤝 [CONTRIBUTING](CONTRIBUTING.md) — Guidelines for workflow, commits, and branch management.
- 🔒 [SECURITY](SECURITY.md) — How to report vulnerabilities and supported versions.
- 📝 [RELEASE_NOTES](RELEASE_NOTES.md) — Changelog of features, fixes, and improvements across releases.

By participating in this project, you agree to uphold these documents. Please review them before submitting issues or pull requests.

## License

MIT — see [LICENCE](LICENCE).
