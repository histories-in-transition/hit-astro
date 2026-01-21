# HiT-Histories in Transition

**HiT-Astro** is an application for managing and interacting with a collection of manuscripts and
historical data, built using [Astro](https://astro.build/). For more on the project itself see the
about page as well as the project site in the
[ACDH website](https://www.oeaw.ac.at/acdh/research/dh-research-infrastructure/activities/web-development/hit-histories-in-transition).

## Table of Contents

- [Datamodel](#data-model)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [License](#license)

## Data Model

This project is based on the data model defined in
[dbdiagram.io](https://dbdiagram.io/d/HiT-6731b349e9daa85acafee5fa) (last updated Dec. 2025), which
structures information on manuscripts, codicological units, manuscript items, works, authors,
genres, and related metadata.

To support the researchers’ workflow, the data is entered into a relational database using
[Baserow](https://baserow.io/). The database content is regularly exported as JSON files and stored
in a [sister repository](https://github.com/histories-in-transition/hit-baserow-dump). These JSON
files are then processed in the current repository, enabling visualizations, tabular views, and
advanced filtered search.

## Data Processing Scripts

All data preprocessing and export scripts are located in the `scripts/` directory:

- **`preprocess/`** – Load and normalize raw JSON data (e.g. manuscripts, works, and related
  entities).
- **`export/`** – Generate LaTeX, PDF, and TEI XML exports from the processed data.
- **`search-index/`** – Build and update the search indices (Typesense).
- **`data-fetch/`** – Fetch raw JSON row data from the sister repository.

### Current and planned processing pipeline

Currently, the preprocessing pipeline is implemented primarily in JavaScript and operates on raw
JSON data fetched from Baserow exports.

Planned improvements include:

- introducing Zod schemas to validate raw Baserow JSON at fetch and build time,
- migrating preprocessing scripts and tei-export scripts from JavaScript to TypeScript,
- adopting an immutable transformation approach (using shallow copies) to improve type safety,
  maintainability, and reliability of the data pipeline.
- Implement an OAI-PMH endpoint for harvesting TEI XML exports
- Implement visualisations: transmission, networks, and spatial analysis of the data

## Getting Started

### Prerequisites

1. **Package Manager**: This project uses `pnpm`. If you haven't installed it:

   ```bash
   npm install -g pnpm
   ```

2. **Clone the repo**

   ```bash
   git clone https://github.com/histories-in-transition/hit-astro.git
   cd hit-astro
   ```

3. **Installation**
   1. Install dependencies:

   ```bash
   pnpm install
   ```

   2. Configure the application: Currently the application uses a base path: 'hit-astro' set in
      `astro.config.mjs`
   3. To run the project locally:

   ```bash
   pnpm run dev
   ```

## Project Structure

- **`src/content/`**: Contains collections of raw and processed JSON data files.
- **`src/components/`**: Contains Astro components (e.g. header, footer), as well as two
  [Svelte](https://svelte.dev/) components used for [Tabulator](https://tabulator.info/) tables and
  the [Leaflet](https://leafletjs.com/) map.
- **`src/pages/`**: Contains pages for tabular views (manuscripts, works, etc.) and detail views of
  individual items.
- **`src/types/`**: Contains TypeScript types and interfaces.
- **`src/lib/`**: Contains configuration and utility functions for the
  [Tabulator](https://tabulator.info/) library, including table-specific configurations for each
  data type.
- **Search interface**  
  **`src/lib/advanced-search/`** and **`src/pages/search.astro`**: Implements the search page with
  instant search (Algolia-compatible), using the
  [Typesense InstantSearch adapter](https://typesense.org/docs/guide/search-ui-components.html#using-instantsearch-js).

## License

This project is licensed under the MIT License.
