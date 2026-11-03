import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import TexHeader from "./tex-header.js";
import { log } from "@acdh-oeaw/lib";

const outputDir = join(process.cwd(), "public", "download", "tex");
const donwloadDir = join(process.cwd(), "public", "download");

mkdirSync(outputDir, { recursive: true });
mkdirSync(donwloadDir, { recursive: true });
async function writeTexFile(filename, content) {
	const filepath = join(outputDir, filename);
	writeFileSync(filepath, content, "utf8");
	log.success(`Generated: ${filename} ${filepath}`);
}

async function generateAllTex() {
	const manuscripts = JSON.parse(readFileSync("src/content/data/manuscripts.json", "utf-8"));
	log.info(`Found ${manuscripts.length} mss. Starting TeX generation ...`);
	for (const manuscript of manuscripts) {
		const tex = TexHeader(manuscript);
		await writeTexFile(`${manuscript.hit_id}.tex`, tex);
	}
	log.success("Tex generated");

	const rows = manuscripts
		.map((ms) => {
			const texFilename = ms.hit_id ? `${ms.hit_id}.tex` : `manuscript_${ms.id}.tex`;
			const teiFilename = ms.hit_id ? `${ms.hit_id}.xml` : `manuscript_${ms.id}.xml`;
			const pdfFilename = ms.hit_id ? `${ms.hit_id}.pdf` : `manuscript_${ms.id}.pdf`;
			const jsonFilename = ms.hit_id ? `${ms.hit_id}.json` : `manuscript_${ms.id}.json`;

			return `
      <tr>
	  <td>${ms.view_label ?? ""}</td>
	  <td>${ms.title ?? ""}</td>
        <td><a href="./tei/${teiFilename}">${teiFilename}</a></td>
        <td><a href="./tex/${texFilename}">${texFilename}</a></td>
        <td><a href="./pdf/${pdfFilename}">${pdfFilename}</a></td>
        <td><a href="./json/${jsonFilename}">${jsonFilename}</a></td>
      </tr>
    `;
		})
		.join("\n");

	const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Download Files for Manuscripts</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 2rem;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f5f5f5;
    }
    tr:nth-child(even) {
      background: #fafafa;
    }
  </style>
</head>
<body>
  <h1>Download Files for Manuscripts</h1>
  <p>${manuscripts.length} manuscripts</p>

  <table>
    <thead>
      <tr>
	  <th>Shelfmark</th>
	  <th>Title</th>
        <th>TEI File</th>
        <th>TEX File</th>
        <th>PDF File</th>
        <th>JSON File</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;

	writeFileSync(join(donwloadDir, "index.html"), indexHtml, "utf8");

	log.success("Generated download index.html");
}

generateAllTex();
