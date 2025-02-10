import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import fetch from "node-fetch";

async function fetchAllData() {
	const folderPath = join(process.cwd(), "src", "content", "raw");
	mkdirSync(folderPath, { recursive: true });

	const githubApiUrl =
		"https://api.github.com/repos/histories-in-transition/hit-baserow-dump/contents/json_dumps";

	try {
		// Fetch the list of files from the GitHub API
		const response = await fetch(githubApiUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch GitHub folder contents: ${response.statusText}`);
		}

		const files = await response.json();

		// Filter only JSON files
		const jsonFiles = files.filter((file) => file.name.endsWith(".json"));

		// Fetch and store each JSON file
		await Promise.all(
			jsonFiles.map(async (file) => {
				const fileResponse = await fetch(file.download_url);
				if (!fileResponse.ok) {
					throw new Error(`Failed to fetch file ${file.name}: ${fileResponse.statusText}`);
				}
				const data = await fileResponse.json();
				writeFileSync(join(folderPath, file.name), JSON.stringify(data, null, 2), {
					encoding: "utf-8",
				});
			}),
		);

		console.log(`All files have been fetched and stored.`);
	} catch (error) {
		console.error("Error fetching data:", error);
	}
}

fetchAllData();
