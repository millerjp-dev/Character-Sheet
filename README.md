# Character Sheet

A React + TypeScript app powered by Vite and pnpm.

## Getting started

Install dependencies and start the development server:

```sh
pnpm install
pnpm dev
```

## Scripts

- `pnpm build` — type-check and create a production build
- `pnpm lint` — run ESLint
- `pnpm preview` — preview the production build locally

## Character data

The app reads the active character from the Google Sheet through a server-side
API. Locally, the server uses the service-account credentials configured by
`GOOGLE_APPLICATION_CREDENTIALS`; the credential file must remain outside `src`
and must never be exposed to the browser. `.env.local` holds local configuration
and is ignored by Git.

For Vercel deployments, the `api/characters.mjs` serverless function serves
`/api/characters`. Configure `GOOGLE_SHEETS_SPREADSHEET_ID` and
`GOOGLE_SERVICE_ACCOUNT_JSON` as Vercel environment variables for the relevant
deployment environments. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the complete
service-account JSON contents; do not commit this value or put it in a
`VITE_`-prefixed variable. Share the spreadsheet with the service account's
`client_email` and grant it Viewer access for character loading. Redeploy after
changing environment variables.
`vercel.json` also rewrites the app's client-side routes (`/cards`, `/debug`,
and `/sheet-editor`) to the Vite entry page so direct navigation and refreshes
work on Vercel without intercepting `/api/characters`.

The spreadsheet must have these tabs and header rows:

- `Characters`: `id`, `name`, `primaryColor`, `secondaryColor`, and optional `imageUrl` and `backgroundTheme`
- `Stats`: `characterId`, `name`, `score`, `modifier`
- `Skills`: `characterId`, `name`, `bonus`

Use `#RGB` or `#RRGGBB` for palette colors. Leave `modifier` blank to hide the
modifier badge; use `0` to show `+0`. Every stat and skill row must reference an
existing character ID. Set `imageUrl` to a publicly accessible HTTP or HTTPS
image URL to show a character portrait; leave it blank for no portrait. The
image is loaded from that URL rather than stored with the website.
Set `backgroundTheme` to `deep-space`, `arcane-forest`, `warm-parchment`, or
`rune-twilight` to choose the whole-app background for that character. Blank
values default to `warm-parchment`.

The spreadsheet editor is available directly at `/sheet-editor` while running
with `pnpm dev` or on Vercel. It can edit a selected cell by choosing an existing
column header, add rows, and delete rows in the `Characters`, `Stats`, and
`Skills` tabs. ID and `characterId` cells are locked to protect relationships;
a character cannot be deleted while it still has stats or skills. Cell values
are written as literal text, not interpreted as formulas. These edits change
the live spreadsheet immediately. The service account needs **Editor** access
to the spreadsheet, and the API uses the Google Sheets read/write scope.

On Vercel, configure `SHEET_EDITOR_PASSWORD` as a server-side environment
variable to enable the editor API. The page prompts for this password and keeps
it in session storage for the current browser tab. Use a long, unique password;
never use a `VITE_`-prefixed variable. If this variable is missing, hosted sheet
editing is disabled. Local development continues to use the localhost API
without a password prompt. The editor is intentionally not linked in the app
navigation. Do not expose local write endpoints or service-account credentials
to the public internet.

Run `pnpm dev` to start both the Vite app and the local Sheets API. The app loads
characters on startup and provides a selector when the spreadsheet has multiple
characters. `CharacterProvider` shares the selected character with its children;
components outside a provider use the default character context.

The character sheet is available at `/` and the card gallery at `/cards`. The
component playground at `/debug` is intentionally omitted from the top
navigation and is accessed through the black-hole link between the Test buttons.
It provides live-editable previews for the components in `src/components`.
The gallery includes the random MTG card and sample image cards. On the
character sheet, focus or hover the black-hole link. It stays invisible for one
second, forms for two seconds, then opens and can be activated to navigate to
Debug. Leaving before it opens resets the sequence. After opening, moving the
pointer away closes it; hovering it again reopens it immediately.
