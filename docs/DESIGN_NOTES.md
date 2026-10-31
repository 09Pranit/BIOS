# Smriva design notes

The interface is built around a school register and a community worker's record book: clear rows, familiar labels and enough space to read or correct an entry. The refinement reduces decorative boxes, repeated badges and slogans while keeping the compact dashboard and its existing workflows.

## Colour and typography

The orbit mark remains the project symbol. Muted greens identify links and primary actions; amber and red are reserved for attention and error states. Meaning also appears in text and icons rather than colour alone.

| Role              | Light theme         | Dark theme           |
| ----------------- | ------------------- | -------------------- |
| Page background   | Off-white `#fbfaf7` | Charcoal `#171d1b`   |
| Secondary surface | `#f0f1eb`           | `#202925`            |
| Main text         | `#28322d`           | `#eef0e9`            |
| Secondary text    | `#59665d`           | `#b2bdb4`            |
| Links             | Green `#2c5f4f`     | Pale green `#a5c9bb` |
| Primary action    | `#365e4e`           | `#bed7c7`            |

Workspace tables and forms use system sans-serif fonts. The public introduction uses a restrained system serif for its main heading, separating the introduction from the working interface. Hindi and Punjabi retain their script-specific system font stacks, natural letter spacing and taller line spacing. No font download is required.

## Layout and copy

- Keep table rows, form labels and validation close to the information they describe. Do not turn every small status into a separate card.
- Use borders to separate sections and rows. Small corners and minimal shadow keep the interface quiet.
- Keep a clear primary action and leave secondary navigation visually lighter. Easy mode uses readable task rows with larger targets rather than a wall of identical tiles.
- Use plain headings such as “To do today,” “Recovery code” and “No health history yet.” Instructions should say what to do and where an entry is saved.
- Keep records saved on the device distinct from records acknowledged by the hub. Shorter copy must retain that difference.
- The public attendance register is labelled **Synthetic example**. Its displayed saving state is also identified as an example; it does not represent a live workspace or deployment.

The library introduction is a short section with a smaller DIKSHA banner, rather than a large promotional panel. Government images and their attached website captions open the existing official pages. Short cards retain visible attribution; descriptions and topic tags remain under **Details**. Original offline lessons keep their illustrations and quizzes.

## Features to preserve

These changes concern presentation. Enrollment, permissions, signed operations, causal conflict review, encrypted records, backup/recovery formats and the existing database names remain compatible. No records are rewritten by changing the theme, language or Easy mode.

The standard dashboard keeps its compact tables, data-entry shortcuts and navigation. Easy mode remains optional. English, हिन्दी and ਪੰਜਾਬੀ remain available before and after unlock; user-entered names and notes retain their original text. Keyboard focus, 44-pixel Easy-mode controls, responsive layouts, offline previews and saved lesson progress remain part of the interface.

The pre-refinement source snapshot is `Smriva-before-design-refinement.zip`. Current browser previews live in `docs/`. Use `npm run build`, `npm test` and `npm run test:e2e` when checking future presentation changes; review both themes, both modes and all three languages. The earlier measured Lighthouse results remain in [Site analysis](SITE_ANALYSIS.md).

The refinement passed the production build, all 21 source checks, 131 automated tests and all 23 browser scenarios, including focused reruns after making the library's inline source link visibly underlined. Desktop/mobile previews: [public home](smriva-home-desktop.png), [phone home](smriva-home-mobile.png), [standard dashboard](smriva-standard-desktop.png), [Easy mode](smriva-easy-mobile.png) and [learning library](smriva-library-desktop.png). Lighthouse was not rerun for this visual update.
