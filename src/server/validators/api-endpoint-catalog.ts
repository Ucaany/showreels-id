export type ApiEndpointCatalogItem = {
  endpoint: string;
  method: "GET" | "POST";
  expectedStatuses: number[];
};

export const API_ENDPOINT_CATALOG: ApiEndpointCatalogItem[] = [
  { endpoint: "/api/site-status", method: "GET", expectedStatuses: [200] },
  { endpoint: "/api/admin/health", method: "GET", expectedStatuses: [403, 200] },
  { endpoint: "/api/videos", method: "GET", expectedStatuses: [200] },
];
