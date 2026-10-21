# Security Policy

The security of our applications and users is our top priority. We appreciate the efforts of security researchers and community members in helping us maintain a safe platform.

---

## 🛡️ Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported          |
| :---    | :---:              |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔒 Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability or security flaw, please report it privately:

1. **GitHub Security Advisory (Recommended):**
   Navigate to the repository's [private vulnerability reporting page](https://github.com/Ahmed-Asif1/tensorslow-aicon2k26/security/advisories/new) and submit a private report.
2. **Include in your report:**
   * A clear description of the vulnerability.
   * Step-by-step instructions or proof-of-concept (PoC) to reproduce the issue.
   * Any potential impact or affected components (e.g. auth, database, API routes).
   * Remediation recommendations if known.

---

## ⏱️ Response & Disclosure Policy

* **Initial Acknowledgement:** We aim to acknowledge reports within **48 hours**.
* **Assessment & Fix:** Once confirmed, we will work on a patch and notify you before public release.
* **Coordinated Disclosure:** We kindly ask that you keep vulnerabilities confidential until we have published a security advisory and released a patched version.

---

## 🛡️ Core Security Invariants in this Codebase

When extending or contributing code to TalentRank AI, ensure compliance with these security principles:
* **No Client-Supplied `ownerId`:** All mutations and queries must derive the user identity from the server-validated session (`auth.api.getSession()`), never from request bodies.
* **No Ephemeral Disk Writes:** File uploads must stream directly to cloud object storage (`@vercel/blob`).
* **Connection Pool Protection:** Never instantiate new `MongoClient` objects per request; use the cached single client in `apps/web/src/lib/db.ts`.
* **Zero Secrets in Git:** Never commit `.env` or secret keys. All environment variables are validated with Zod in `src/lib/env.ts`.
