# VCF/Plotein

A **Vue 3** web application for the clinical interpretation of genetic variants from exome sequencing VCF files. It maps raw genomic variants onto protein structures so clinicians and researchers can visually assess pathogenicity, functional impact, and clinical relevance — through a single, modern clinical-genomics workspace.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license)
[![Published in Bioinformatics 2019](https://img.shields.io/badge/Published-Bioinformatics%202019-b31b1b.svg)](https://academic.oup.com/bioinformatics/article/35/22/4803/5510555)
[![DOI](https://img.shields.io/badge/DOI-10.1093%2Fbioinformatics%2Fbtz458-1f6feb.svg)](https://doi.org/10.1093/bioinformatics/btz458)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![D3 v7](https://img.shields.io/badge/D3-v7-f9a03c.svg)](https://d3js.org/)

**[Live demo](https://vcfplotein-production.up.railway.app)** &nbsp;·&nbsp; **[Published in Bioinformatics (2019)](https://academic.oup.com/bioinformatics/article/35/22/4803/5510555)** &nbsp;·&nbsp; **[Open-access full text (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6853650/)** &nbsp;·&nbsp; **[Original instance (LIIGH-UNAM)](http://vcfplotein.liigh.unam.mx)**

![VCF/Plotein — BAP1 variant lollipop plot with clinical database tracks](public/screenshot.png)

## Published research

VCF/Plotein is a peer-reviewed clinical genomics tool I developed at the **Cancer Genetics & Bioinformatics Lab, LIIGH-UNAM** (Laboratorio Internacional de Investigación sobre el Genoma Humano, Universidad Nacional Autónoma de México), Querétaro, Mexico. The accompanying research was published in *Bioinformatics* (Oxford University Press) in 2019.

> Ossio, R., Garcia-Salinas, O.I., **Anaya-Mancilla, D.S.**, Garcia-Sotelo, J.S., Aguilar, L.A., Adams, D.J., Robles-Espinoza, C.D. (2019). **VCF/Plotein: visualization and prioritization of genomic variants from human exome sequencing projects.** *Bioinformatics*, 35(22), 4803–4805. Oxford University Press. DOI: [10.1093/bioinformatics/btz458](https://doi.org/10.1093/bioinformatics/btz458)

## About this branch — 2026 modernization

The original tool was built in 2018–2019 on **Nuxt 2 / Vue 2 / Webpack / node-sass / Bootstrap-Vue** — a toolchain that no longer installs or builds on a current Node.js. This branch is later, independent work on the codebase: it first brought the project up to a present-day front-end stack, and then carried out a full UI/UX redesign on top of it.

### Stack modernization

- **Nuxt 2 / Vue 2 → Vue 3 + Vite 5** — Composition API with `<script setup>`; dev server cold-start ~0.2s.
- **Vuex → Pinia**, **Nuxt file-routing → Vue Router 4**.
- **node-sass → Tailwind CSS v4** — the UI chrome rebuilt with Tailwind; native Sass compilation removed.
- **Bootstrap-Vue → hand-rolled Tailwind components** (data table, pagination, file input).
- **D3 v5 → D3 v7** — including the v6 event-handler API change across the lollipop renderer.
- **Expired-certificate proxy** for the companion backend — see [Architecture highlights](#architecture-highlights).

### UI/UX redesign

With the stack current, the interface was redesigned from the dated 2019-era layout into a modern, light clinical-genomics platform:

- **Design system.** A light theme — white cards on a soft canvas — with clinical semantic colors. Typography pairs **Schibsted Grotesk** for the UI with **IBM Plex Mono** for genomic data (positions, coordinates, amino-acid changes).
- **Unified information architecture.** The two disconnected pages (an upload wizard, then a separate graph page) were merged into one workspace shell: a top bar plus a persistent, collapsible **inspector sidebar** with accordion sections (dataset, transcript, consequence / protein-domain / clinical-database / sample filters, and bookmarks). The main area shows a **gene browser** when no gene is selected and the **plot workspace** once one is.
- **Rewritten lollipop plot.** The D3 plot now supports zoom and pan along the protein axis, hover tooltips, click-to-select a variant, domain hover, a redesigned database-presence track, and smooth transitions.
- **Gene context that stays visible.** The cramped readout strip became a **gene header card** with stat tiles, and variant detail moved into a **docked side panel** that keeps the gene in view while a variant is inspected.
- **Responsive and stateful.** The sidebar collapses into an overlay drawer on narrow viewports, and the app has proper empty and loading states throughout.
- **Bug fix.** A transcript-switching bug — caused by passing an object through a router query parameter — was fixed.

## Why VCF matters

The Variant Call Format (VCF) is the standard file for storing DNA sequence variations—SNPs, insertions, deletions, and structural variants—generated by next-generation sequencing. A single exome can yield tens of thousands of variants. Identifying the handful that are clinically actionable requires integrating genomic coordinates with gene annotations, protein domains, population frequencies, and pathogenicity predictions. This tool automates that pipeline in the browser.

## What this app does

1. **Upload & parse** — Accepts `.vcf`, `.vcf.gz`, or saved `.json` bookmarks directly in the browser.
2. **Gene extraction** — Uses the reference genome (GRCh37/hg19 or GRCh38) to map variant positions to coding genes, then lists them in a searchable gene browser.
3. **Annotation** — Queries the Ensembl VEP REST API to annotate consequences, amino-acid changes, protein domains, and transcript structures.
4. **Clinical cross-referencing** — Checks variant presence in ClinVar, COSMIC, dbSNP, and gnomAD via a companion API.
5. **Pathogenicity scoring** — Displays SIFT and PolyPhen predictions for missense variants.
6. **Protein visualization** — Renders an interactive D3.js lollipop plot with zoom/pan along the protein axis, hover tooltips, click-to-select variants, and a database-presence track — variants mapped onto annotated protein domains.
7. **Filtering & exploration** — Filter by transcript, consequence type, protein domain, sample, and clinical-database presence from the inspector sidebar; toggle between plot and tabular views.
8. **Export & bookmarks** — Save sessions as JSON bookmarks, export tables as CSV, and download plots as SVG or PNG.

The whole flow lives in a single workspace: a top bar, a persistent inspector sidebar, and a main area that switches between the gene browser and the plot workspace.

## Tech stack

- **Framework:** Vue 3 (Composition API, `<script setup>`)
- **Build tool:** Vite 5
- **State & routing:** Pinia, Vue Router 4
- **Styling:** Tailwind CSS v4 — light clinical design system; Schibsted Grotesk (UI) + IBM Plex Mono (genomic data)
- **Visualization:** D3.js v7 — interactive lollipop plot with zoom/pan, tooltips, selection, protein domains, and database-presence tracks
- **Production server:** zero-dependency Node.js server (`server/index.js`) — static host + API proxy
- **Genomics utilities:** `pako` (gzip), `@gmod/bgzf-filehandle`, an interval-tree gene mapper

## Architecture highlights

- **Raw genomic data never leaves the browser.** VCF and gzipped `.vcf.gz` files are decompressed and parsed entirely client-side with `pako` — a deliberate privacy choice, since exome data is PHI and clinical labs should not have to upload it to a third party.
- **Companion-backend proxy.** The variant-database lookups (ClinVar/COSMIC/dbSNP/gnomAD) are served by a backend at LIIGH-UNAM whose TLS certificate has expired, which browsers refuse to call directly. The app instead requests a relative `/api/*` path; both the Vite dev server and the production Node server (`server/index.js`) reverse-proxy those calls to the upstream, transparently bypassing the expired certificate. The browser only ever talks to a valid-certificate origin.
- **Lazy-loaded gene reference data.** The GRCh37/38 gene coordinate tables (~13 MB) are code-split into a separate chunk that loads only when a raw VCF actually needs gene mapping — keeping the initial bundle around 370 KB.
- **Interval-tree gene mapping.** Variant positions are matched to coding genes via a lazily-built interval tree, with a priority queue assisting coordinate partitioning — fast per-variant lookups across exomes with tens of thousands of variants.
- **D3 v7 lollipop rendering.** Variants are drawn along the protein sequence and overlaid on annotated protein domains in a single coherent drawing pass that keeps zoom, transitions and selection state in sync. The plot supports zoom and pan along the protein axis, hover tooltips, click-to-select, domain hover, keyboard navigation, and SVG/PNG export — the latter resolving the design-system palette to literal colors so a standalone exported SVG renders correctly without a stylesheet.

## Running locally

```bash
npm install

npm run dev      # Vite dev server with hot reload at localhost:3000
npm run build    # production build → dist/
npm start        # serve dist/ + proxy /api → node server/index.js
npm run lint     # ESLint
```

No special toolchain is required — the project builds on current Node.js. In development, the Vite dev server proxies `/api/*` to the LIIGH-UNAM companion backend automatically; the Ensembl REST API is called directly.

## Deployment

Live on Railway at **[vcfplotein-production.up.railway.app](https://vcfplotein-production.up.railway.app)**. The production artifact is the `dist/` build served by `server/index.js` — a zero-dependency Node server that serves the SPA and reverse-proxies `/api/*` to the companion backend (transparently bypassing the upstream's expired TLS certificate). Any Node host works:

- **Build command:** `npm run build`
- **Start command:** `npm start`

The server reads `PORT` from the environment.

## Sample data

`public/bap1-sample.vcf` is a small BAP1 variant set for trying the upload flow. The built-in **Demo** button loads a pre-computed BAP1 dataset with no file needed.

## Screenshots

The BAP1 demo dataset rendered as an interactive D3.js lollipop plot — variants mapped onto the protein's domains, with ClinVar / COSMIC / dbSNP / gnomAD presence tracks:

![BAP1 variant lollipop plot rendered by VCF/Plotein](public/screenshot.png)

![BAP1 protein lollipop detail](public/bap1.png)

## Why this project matters

Precision medicine depends on turning raw sequencing data into interpretable insights. By visualizing how exome variants map to protein structure and combining them with clinical and pathogenicity databases, this tool reduces the manual burden on molecular biologists and supports faster, more informed clinical decisions.

## Author

The VCF/Plotein web application — its interface, data visualization and architecture — was designed and written by **[Diego Said Anaya-Mancilla](https://github.com/redcpp)**. The original 2018–2019 implementation and the 2026 ground-up rewrite to a modern Vue 3 / Vite stack (documented above) are both his work.

The application was developed at the **Cancer Genetics & Bioinformatics Lab, LIIGH-UNAM** (Querétaro, Mexico), where the surrounding research was carried out and published in *Bioinformatics* (2019) — see [Published research](#published-research). That publication is credited to the full lab team.

## License

Released under the [MIT License](LICENSE.txt). Copyright 2018 Carla Daniela Robles Espinoza (LIIGH-UNAM).
