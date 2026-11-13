# Deploying ShelfDesk with Render + Name.com

This is a *reference* deployment guide. No accounts, domains, or billing subscriptions have been created by this file. **The website is not live** until you complete the steps and verify the public URL. Do not enter real personal data; this demonstration uses simulated sign-in and public API access.

## Before starting

- A GitHub account and a Render account
- A registered domain in Name.com (domain purchase is a separate paid transaction)
- Permission to activate a **paid** Render web service with persistent storage (see current pricing before confirming)

## A. Upload the project

1. Create a new GitHub repository; private is fine if you connect GitHub to Render.
2. Upload **the contents of this folder directly to the repository root**. In particular, `server.js`, `package.json`, and `render.yaml` must appear at the top level (not inside an extra nested folder).
3. Do not commit `.env`, account passwords, credit card data, or real client records.

## B. Deploy on Render

1. Sign in to https://dashboard.render.com.
2. Choose **New > Blueprint**; connect the GitHub repository containing `render.yaml`.
3. Check the planned resources and prices **before approving**: Node web service (paid 0.5c-512mb plan), 1 GB persistent disk mounted at `/var/data`.
4. Complete the service creation and wait for the Render deployment to show live.
5. Visit Render's assigned `https://...onrender.com` URL. Check the login screen, sign in using a demo username/password, add a test record, refresh and verify it appears.
6. Check the service's `https://...onrender.com/api/health` endpoint returns `{"ok":true}`.
7. Confirm the service has an attached persistent disk and the environment variable `DATA_FILE=/var/data/books.json`. **Do not use the free web service**, since local JSON data can be lost on deploy/restart.
8. The persistent disk starts empty. The checked-in sample books are only local demonstration data. Records created online are saved separately on the Render disk.

If you choose **New > Web Service** rather than a Blueprint, select the same repository and enter:

- Runtime/Language: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Environment variable: `DATA_FILE=/var/data/books.json`
- Paid plan with a persistent disk mounted at `/var/data` (1 GB is sufficient for this small demonstration)

## C. Connect Name.com domain

1. In the Render service dashboard, open **Settings > Custom Domains** and add your **actual purchased domain**; follow any verification instructions Render displays.
2. In Name.com, open **My Domains > [your domain] > Manage DNS Records** (the exact labels may vary).
3. Remove only conflicting default/parking records; preserve unrelated records, especially MX/TXT records if the domain already uses email.
4. Create these DNS records, substituting the **actual Render-provided hostname**; do not use the placeholder literally:

   | Type | Host | Answer/Target |
   | ---- | ---- | ------------- |
   | ANAME | @ (root domain) | `YOUR-SERVICE.onrender.com` |
   | CNAME | www | `YOUR-SERVICE.onrender.com` |

   Use the exact DNS values shown by Render if they differ. Render documents Name.com support for ANAME on root domains. Remove conflicting AAAA records if they interfere with Render's custom domain verification, but do not delete unrelated DNS settings.
5. Return to Render to verify your custom domain. Wait for DNS propagation and TLS certificate issuance; don't report success until both `https://yourdomain` and any intended `www` redirect work.
6. Test from a different internet connection, create a disposable record, refresh, and verify persistence across a service restart/redeploy before relying on it.

## D. Accessibility and submission checks

- Run axe DevTools or WAVE on the *deployed* pages and save real screenshots/scan exports.
- Test keyboard-only navigation, screen-reader announcements, mobile width, 200% zoom, and colour contrast; record findings and fixes.
- Write the accessibility statement and evaluation **from tests you personally performed**; don't claim tests occurred unless they did.
- Include your actual live URL and your own completed PDF with the project files in the final submission ZIP.

## Troubleshooting

- **Page won't load:** Check Render logs, Node service status, and `/api/health`.
- **Data disappears:** Confirm the service is paid, that a disk is attached at `/var/data`, and that `DATA_FILE` points to `/var/data/books.json`.
- **Domain won't verify:** Inspect Name.com DNS records, conflicting parking/AAAA records, and Render's custom domain guidance. DNS may take time to propagate.
- **Sign-in is not secure:** This course demo intentionally simulates sign-in. Do not enter real passwords or sensitive information; API operations are not authenticated.

Official documentation:
- https://render.com/docs/blueprint-spec
- https://render.com/docs/disks
- https://render.com/docs/configure-other-dns
- https://render.com/docs/custom-domains
- https://www.name.com/support/articles/205188538-managing-dns-records
