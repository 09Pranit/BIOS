# English, Hindi and Punjabi

Three native buttons at the top of the workspace, unlock and recovery screens select English, हिन्दी or ਪੰਜਾਬੀ. The active choice has a check mark and `aria-pressed`; keyboard Tab, Enter and Space work without a custom keyboard model. Labels identify each language in its own script.

## Coverage

- Workspace navigation, connection/saving status, themes and lock controls.
- Standard and Easy dashboards, help instructions and local search.
- Child registration/import, attendance, marks and health entry.
- Child detail, conflict review, sync and backup/recovery settings.
- Learning-library controls, government programme descriptions, audiences and tags; search matches original and translated descriptions.
- All four original lessons: title, description, paragraphs, questions, options, durations and class levels. Answer indices and saved progress use the same canonical lesson IDs.
- Hub database forms, devices, invitations, audit/quarantine controls and lab controls.

Names, village names, free-text notes, IDs, signed operation values, CSV column names and backend enum values stay as stored. Selecting a different language does not rewrite records or reload/remount the forms. Government artwork and linked portals retain their publishers' languages. Raw technical event logs and About/source documentation remain English and use explicit English language markup.

## Offline and layout

Translations ship in the application bundle; switching does not require a translation service, network font or internet request. The browser preference `smriva-language` stores only `en`, `hi` or `pa`; unsupported values fall back to English. Preference writes failing in restricted browser storage do not prevent session use. Other open tabs receive preference changes through the storage event.

The document language and date locale follow the selected language: `en-IN`, `hi-IN` or `pa-IN`. All three interfaces remain left-to-right. Hindi uses available Nirmala UI / Noto Sans Devanagari / Mangal system fonts; Punjabi uses Nirmala UI / Noto Sans Gurmukhi / Raavi. Added line spacing, normal script letter spacing, wrapping navigation labels and a stacked phone language picker accommodate the scripts. Easy mode keeps larger controls.

Punjabi month names are bundled for the dashboard dates, including browsers whose ICU data would otherwise display a placeholder such as `M10`. Numeric stored dates retain their original values.

## Maintenance and verification

`apps/pwa/src/lib/i18n.tsx` owns the provider, validated preference and interpolation. Feature dictionaries live in `apps/pwa/src/locales/`; keys are original English UI text, with Hindi and Punjabi values. Use `t('Hello, {name}', { name })` for dynamic text so user content never enters the translation lookup. Keep API values explicit on options and translate only their displayed labels. Shared headings that contain a person's name must opt out of title translation.

`tests/languages.test.ts` checks supported preferences, fallbacks, verbatim interpolation and placeholder consistency. `tests/e2e/languages.spec.ts` checks keyboard selection, unchanged enrollment role values, unfinished entries, offline saving, mobile layouts/themes/modes, accessibility scans and Punjabi lesson progress after offline unlock. Existing English browser scenarios remain regression coverage.

Preview the [Hindi desktop interface](smriva-hindi-desktop.png) and [Punjabi phone interface](smriva-punjabi-mobile.png). The production build, 131 unit/integration tests and all 23 browser scenarios passed, with focused reruns after the final fixes.
