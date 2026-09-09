# RESYIN Publications

Bookstore featuring Prof. Johnson A. Egonmwan and a growing catalog of authors.

- Website: https://resyinpublications.com
- Email: info@resyinpublications.com
- Phone / WhatsApp: +2349041441646 and +2348034621513

## Project folders

- `client`: React and Vite storefront, plus Vercel API helpers.
- `server`: Express backend for accounts, books, orders, and payments.

## Development

Install dependencies separately in `client` and `server`. Run `npm run dev` from the root for the storefront, and `npm run start:server` for the backend.

## Deployment

Import this repository into Vercel with root directory `client`, framework Vite, build command `npm run build`, and output directory `dist`.

Set `VITE_API_URL` and `BACKEND_URL` to the deployed RESYIN backend origin, and `CLIENT_URL` to `https://resyinpublications.com`. Configure `VITE_GOOGLE_CLIENT_ID` for Google sign-in.

The backend requires its own deployment and RESYIN database, storage, email, payment, and authentication configuration. Environment files are not committed. Do not reuse another application's production database or account credentials.
