import { Client } from "typesense";

export function createTypesenseClient() {
	const client = new Client({
		nodes: [
			{
				host: "typesense.acdh-dev.oeaw.ac.at",
				port: 443,
				protocol: "https",
			},
		],
		apiKey: "m4HIiAYUUfemilHQ5LvSTC6hqEiNCjSX",
		connectionTimeoutSeconds: 5,
	});

	return client;
}
