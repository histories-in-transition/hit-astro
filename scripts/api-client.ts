import { request } from "@acdh-oeaw/lib";

const baseUrl =
	"https://raw.githubusercontent.com/histories-in-transition/hit-baserow-dump/refs/heads/main/json_dumps/";

export function fetchData(fileName) {
	return request(new URL(fileName, baseUrl), {
		responseType: "json",
	}).then((data) => ({ fileName, data }));
}
