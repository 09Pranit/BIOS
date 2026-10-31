# Learning library

Smriva's library combines four original illustrated offline lessons with eight government-programme cards. Search and Education / Health & wellbeing filters help people find resources. Every programme card identifies its provider and links to the official page, original image and reproduction policy.

Click a government image or its attached website caption to open the official page in a new tab. The featured DIKSHA banner also opens DIKSHA. Shorter image panels and reduced spacing keep the cards compact; descriptions, audiences and topic tags are available under **Details**. Image credits and reproduction-policy links stay visible. The four offline lesson cards also use shorter covers.

The existing lesson IDs, quizzes and saved progress remain compatible. The standard dashboard and Easy mode remain available.

## Government resources

| Programme                           | Official information                                                                                   | Image provider                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| DIKSHA                              | [Learning platform](https://diksha.gov.in/)                                                            | Ministry of Education, Department of School Education & Literacy |
| PM e-VIDYA                          | [Programme website](https://pmevidya.education.gov.in/)                                                | Ministry of Education, Department of School Education & Literacy |
| NIPUN Bharat                        | [Ministry information on PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291340&reg=48&lang=2) | Ministry of Education, Department of School Education & Literacy |
| Samagra Shiksha                     | [Ministry information on PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291279&reg=48&lang=2) | Ministry of Education, Department of School Education & Literacy |
| PM SHRI Schools                     | [Programme website](https://pmshri.education.gov.in/)                                                  | Ministry of Education, Department of School Education & Literacy |
| PM POSHAN                           | [Ministry information on PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2290055&reg=48&lang=2) | Ministry of Education, Department of School Education & Literacy |
| Rashtriya Bal Swasthya Karyakram    | [Child health programme](https://nhm.gov.in/index1.php?lang=1&level=4&lid=583&sublinkid=1190)          | National Health Mission, Ministry of Health & Family Welfare     |
| Rashtriya Kishor Swasthya Karyakram | [Adolescent health programme](https://nhm.gov.in/index1.php?lang=1&level=2&lid=221&sublinkid=818)      | National Health Mission, Ministry of Health & Family Welfare     |

Sources were checked on 31 October 2026. Programme links may point to Ministry-authored PIB information where legacy programme URLs were unreliable. Descriptions introduce the resources; Smriva does not assess eligibility or provide clinical advice.

## Offline behaviour and attribution

The eight original government image files and four original lesson illustrations are bundled locally and precached with the application. After a successful online installation/cache, these previews and Smriva's lessons remain available without internet. External programme websites require internet and open in a new tab. Smriva does not download the external portals, textbooks or their full collections.

Government images retain their original bytes and proportions. Education images follow the [Department of School Education & Literacy policy](https://www.dsel-education.gov.in/policies/copyright-policy); health images follow the [National Health Mission policy](https://nhm.gov.in/index4.php?lang=1&level=0&lid=13&linkid=8). Attribution is displayed with every image. These policies exclude identified third-party material and do not imply government endorsement. The four original Smriva lesson illustrations remain CC BY 4.0; see [content attribution](../CONTENT_LICENSE.md).

## Maintenance

- `packages/content/government-education.json` contains the six education entries; `apps/pwa/src/lib/government-resources.ts` adds the two health entries.
- `packages/content/government-sources.json` records the exact image URLs, retrieval dates, providers, reproduction policies, byte sizes and SHA-256 checksums. The combined source manifest includes these records.
- `npm run library:fetch` downloads the curated official images and regenerates manifests. The script validates official HTTPS hosts, safe local filenames, size limits and PNG/JPEG signatures before writing files.
- `npm run content:prepare` regenerates attribution from existing local files. `npm run build` checks all 21 source records and builds the offline cache.

`tests/e2e/library-resources.spec.ts` covers search and filters, image/keyboard portal navigation, expandable details, source links, failed-image fallbacks, phone layout, accessibility in both modes/themes, offline image loading and quiz saving. Portal-navigation tests intercept the target website locally so verification does not depend on external availability. Preview screenshots are [desktop](smriva-library-desktop.png) and [mobile](smriva-library-mobile.png).
