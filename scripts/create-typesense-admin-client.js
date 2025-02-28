import { Client } from "typesense";

export function createTypesenseAdminClient() {

  const client = new Client({
    nodes: [
      {
        host: process.env.PUBLIC_TYPESENSE_API_HOST,
        port: process.env.PUBLIC_TYPESENSE_API_PORT,
        protocol: process.env.PUBLIC_TYPESENSE_API_PROTOCOL,
      },
    ],
    apiKey: process.env.TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 2,
  });

  return client;
}
