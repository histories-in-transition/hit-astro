// filepath: /src/global.d.ts
export {};

declare global {
	interface Window {
		updateMapWithFilteredIds?: (filteredIds: string[]) => void;
	}
}
