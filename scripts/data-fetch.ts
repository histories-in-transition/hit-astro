import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  getHands,
  getManuscripts,
  getMsItems,
  getStrata,
  getWorks,
  getScribes,
  getCodUnits
} from "./api-client.js";

async function fetchAllData() {
  const folderPath = join(process.cwd(), "src", "content", "data");
  mkdirSync(folderPath, { recursive: true });

  const data = await Promise.all([
    getHands(),
    getManuscripts(),
    getMsItems(),
    getStrata(),
    getWorks(),
    getScribes(),
    getCodUnits(),
  ]);
  data.forEach(({ fileName, data }) => {
    writeFileSync(join(folderPath, fileName), JSON.stringify(data, null, 2), {
      encoding: "utf-8",
    });
  });
}

fetchAllData()
  .then(() => {
    console.log(`All files have been fetched and stored`);
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });
