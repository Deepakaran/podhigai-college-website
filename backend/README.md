# Backend configuration and regression checks

Run `npm start` from this directory (or `node backend/server.js` from the project root). Executable startup loads **backend/.env**, validates authentication configuration, connects to MongoDB, and starts the API. Importing `server.js` exports the app, server, startup function and models without reading `.env`, connecting, seeding, or listening.

Default event/gallery seeding is opt-in with `SEED_DEFAULT_CONTENT=true`. Use it only for initial setup, then unset it so intentionally emptied collections remain empty after restarts. The operating system DNS configuration is respected.

Set these values in deployment environment variables or `backend/.env`:

```dotenv
MONGODB_URI=<your MongoDB connection URI>
ADMIN_USERNAME=<your admin username>
ADMIN_PASSWORD=<your password>
JWT_SECRET=<a long randomly generated secret>
PORT=3001
NODE_ENV=production
CORS_ORIGINS=https://podhigai-college-website.web.app,https://podhigai-college-website.firebaseapp.com
```

The hosting origins above correspond to the repository's Firebase project. Add other deployed frontend origins explicitly, comma-separated. Arbitrary Firebase sites are no longer allowed. `NODE_ENV=development` additionally permits HTTP/HTTPS origins with the exact hostnames `localhost`, `127.0.0.1`, or `[::1]`; production has no implicit localhost allowance. Requests without an Origin header remain supported. The same origin policy applies to Socket.IO, including websocket handshakes.

Authentication has no built-in username, password, or signing-secret fallback. Usernames are trimmed and case-insensitive. Passwords are compared literally, including leading/trailing spaces; quote such passwords in dotenv files. JWT_SECRET is trimmed consistently. Existing admin tokens must be replaced by logging in again after this update. Tokens retain the existing deterministic HMAC design, so automatic token expiry/session revocation is not provided.

## Request validation

- Contact, review, event, gallery and chairman fields must have the expected JSON types and fit their length limits. Review ratings must be numeric integers 1–5; gallery ordering must be numeric nonnegative integers. Event booleans must be actual JSON booleans.
- Event/gallery partial updates retain omitted fields. Invalid record IDs and invalid query types return 400; missing messages marked as read return 404.
- Search strings are treated literally, not as caller-supplied regular expressions. Pagination requires positive integers, with a maximum page size of 100. Message date filters use valid `YYYY-MM-DD` dates and UTC day boundaries.
- Images are limited to 10 MiB per string and event galleries to 50 entries; the existing 25 MiB whole-request limit remains in place. Gallery reorder batches accept at most 1,000 unique IDs.
- Public review responses omit stored IP addresses. Chairman updates report persistence failures instead of publishing unsaved in-memory values.

## Isolated checks

```sh
npm test
node --check server.js
node --check validation.js
```

The `node:test` suite invokes the registered request-validation middleware and route handlers with mocked Mongoose persistence. It does not read `.env`, connect to MongoDB, open an HTTP listener, or mutate any live service. HTTP parsing, rate limiting, deployment networking and real MongoDB integration remain separate integration checks.

Featured-event changes save the requested event before demoting others, so invalid, missing, or failed target writes cannot clear the existing featured event. These are still two database operations: concurrent featured edits or a failure during the second operation require transaction-level handling if strict cross-document atomicity is needed.
