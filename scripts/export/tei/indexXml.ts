import type { Manuscript } from "@/types";

import { esc } from "./partials/helpers.ts";

export interface IndexEntry {
	filename: string;
	ms: Manuscript;
}

const styles = `
    body { font-family: sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    tr:nth-child(even) { background: #fafafa; }
`;

/** A simple HTML page that links to all generated TEI files. */
export function makeIndexPage(entries: IndexEntry[]): string {
	const rows = entries
		.map(
			({ filename, ms }) => `
      <tr>
        <td><a href="./${esc(filename)}" download="${esc(filename)}">${esc(filename)}</a></td>
        <td>${esc(ms.view_label)}</td>
        <td>${esc(ms.title)}</td>
      </tr>`,
		)
		.join("\n");

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TEI Manuscripts</title>
  <style>${styles}</style>
</head>
<body>
  <h1>TEI Manuscripts</h1>
  <p>${entries.length} manuscripts</p>
  <table>
    <thead>
      <tr><th>TEI File</th><th>Shelfmark</th><th>Title</th></tr>
    </thead>
    <tbody>${rows}
    </tbody>
  </table>
</body>
</html>`;
}
