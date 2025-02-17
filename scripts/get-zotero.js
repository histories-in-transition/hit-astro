import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function fetchZoteroEntries() {
	const groupID = "5525026";
	const baseUrl = `https://api.zotero.org/groups/${groupID}/items?format=json&limit=50`;
	// Set the output folder
	const folderPath = join(process.cwd(), "src", "content", "data");
	mkdirSync(folderPath, { recursive: true });

	let allItems = [];
	let start = 0;
	let hasMore = true;

	try {
		while (hasMore) {
			const response = await fetch(`${baseUrl}&start=${start}`);
			if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

			const data = await response.json();
			if (data.length === 0) {
				hasMore = false;
			} else {
				allItems = allItems.concat(data);
				start += 50; // Move to the next batch
			}
		}

		// Write final array to JSON file **after** fetching all entries
		writeFileSync(join(folderPath, "bibliography.json"), JSON.stringify(allItems, null, 2), {
			encoding: "utf-8",
		});

		console.log(`Fetched ${allItems.length} items stored in data folder`);
	} catch (error) {
		console.error("Error fetching Zotero entries:", error);
	}
}

fetchZoteroEntries();
