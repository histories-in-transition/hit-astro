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

## Datamodel

This project uses the data model defined in
[dbdiagram.io](https://dbdiagram.io/d/HiT-6731b349e9daa85acafee5fa) to organize and store
manuscripts, codicological units, manuscript items, works, authors, genres, and related metadata. To
suit the researchers' aim the data is entered in a relational database
[baserow](https://baserow.io/). This data is dumped on a regular basis in a
[sister repository](https://github.com/histories-in-transition/hit-baserow-dump). The JSON files are
then processed in the current repository, making visualizations and advanced filtered search
possible.  
For the preprocessing we use the following scripts:

```
scripts/
├── preprocess-data.js (main entry point)
├── data-loader.js (load data from raw json)
├── processors/
│   ├── places.js
│   ├── libraries.js
│   ├── msitems.js
│   ├── hands.js
│   ├── scribes.js
│   ├── cod-units.js
│   ├── strata.js
│   ├── works.js
│   └── manuscripts.js
└── utils/
    ├── utils.js (small enrichment functions)
    └──  logger.js
```


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

- **`src/content/`**: Contains collections and JSON data files (fetched using the scripts in the
  scripts folder).
- **`src/components/`**: Contains _astro_ components such as header, footer etc.
- **`src/pages/`**: Contains the web pages to tables (of manuscripts, works etc.) or detail view of
  single items (manuscripts, works etc).
- **`src/lib/`**: Contains scripts for the advanced search, and the
  [Tabulator library](https://tabulator.info/) used to display JSON data in tables.
- `src/lib/advanced search` and `src/pages/search.astro` (search interface): Implements the search
  page with (Algolia) instant search (using
  [Typsesence instance search adapter](https://typesense.org/docs/guide/search-ui-components.html#using-instantsearch-js)).
- **`scripts/`**: Scripts for fetching data.

## License

This project is licensed under the MIT License.
