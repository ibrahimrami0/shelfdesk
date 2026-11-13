# ShelfDesk — accessible library records reference

**Purpose:** A runnable teaching/reference prototype for a library desk interface. This is **not a tested, submitted, or deployed university assignment**. Follow your course's academic-integrity and attribution rules; do not misrepresent its authorship.

## Requirements

- Node.js 18 or later
- A browser (Chrome, Firefox, or Edge)
- No packages to install; no CDN needed

## Run locally

1. Open a terminal in this folder.
2. Run `npm start` (or `node server.js`).
3. Open `http://localhost:3000`.
4. Sign in using **any non-empty username/password** (simulation only).
5. Try the dashboard, Add a book, and All records pages.
6. Stop the server using Ctrl+C.

The app reads/writes `data/books.json` **on the server**. New records and loan status changes survive browser refreshes or server restarts. The archive includes 20 invented sample records. To reset sample data, save a fresh copy of the original `data/books.json` before testing. **Do not use real client or borrower data**: the sign-in is not real authentication and API endpoints are unprotected.

## Reference features

- Native semantic HTML, including landmarks, labelled forms, `fieldset`/`legend`, table caption and header scopes.
- Simulated sign-in with inline validation and delayed progress feedback.
- Dashboard counts and recent records.
- Add-record form with text, select, radio, checkbox, and conditional borrower/due-date fields.
- Server-side JSON data persistence with Node HTTP API: `GET /api/books`, `POST /api/books`, `PATCH /api/books/:id`.
- Search/filter/sort and eight records per page; table on desktop and list on small screens.
- Accessible confirmation/error announcements, labelled controls, visible focus and native modal loan dialog.
- CSS responsive breakpoints, reduced-motion preference and no inline CSS or scripts.

## Tests

Run:

```sh
npm test
```

This runs automated Node server/validation checks only. **These are not substitutes for WCAG/manual accessibility testing.**

## Accessibility test checklist (perform and record results yourself)

- Navigate entirely with Tab, Shift+Tab, Enter, Space and Escape; check visible focus and modal behavior.
- Test form errors and save/return messages with a screen reader (NVDA or VoiceOver).
- Use axe DevTools or WAVE and save dated screenshots or issue logs; fix all findings you can.
- Check text and control contrast ratios (WCAG 2.1 AA: 4.5:1 normal text; 3:1 large text and significant UI).
- Check the app at 320px mobile width, tablet width and 200% browser zoom, including filtered records.
- Test empty search results, invalid form submissions, connectivity failures, page refresh and browser restart.
- Check HTML/CSS validity and the browser DevTools console.
- Independently write your accessibility statement and evaluation from observations and evidence, including known limitations.

## Deployment notes

A live domain and publicly reachable server are **not included**. A local server does not satisfy a deployment requirement.

A typical approach is to provision a Node-compatible VPS, install Node 18+, upload these files, set a production `PORT`, run the server with a process manager (such as systemd), configure a reverse proxy such as Nginx, register a domain and point its DNS A/AAAA records to your VPS, and enable HTTPS with a trusted TLS certificate. Test the real URL using a separate device. Persistent data requires an actual writable disk; a file-based app may lose records on ephemeral hosting.

**Security warning:** Simulated sign-in is intentionally allowed only for a demo. Anyone with the URL can access the records. Never deploy private or sensitive data without real authentication/authorization.

## Files

- `public/index.html` — interface and semantics
- `public/styles.css` — responsive visual styles
- `public/app.js` — browser-side interactions
- `server.js` — HTTP server and JSON read/write API
- `data/books.json` — server data (sample records)
- `tests/server.test.js` — automatic tests
- `TESTING-WORKSHEET.md` — blank evidence worksheet for your own tests

## Name.com + Render packaging

This distribution includes `render.yaml` and `DEPLOY-NAME-COM.md`. Its Blueprint declares a paid Node service with a 1 GB persistent disk. DNS, account connection, billing approval, and a real accessibility scan still require manual completion. Deployment has **not** occurred merely because this configuration exists.
