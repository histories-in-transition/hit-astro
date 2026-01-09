let serverErrorVisible = false;

/**
 * Narrow unknown errors into something we can inspect
 */
type HttpErrorLike = {
	status?: number;
	httpStatus?: number;
};

/**
 * Detect Typesense / network server errors (500+ or network failure)
 */
function isTypesenseServerError(err: unknown): boolean {
	// Network / fetch failure
	if (err instanceof TypeError) {
		return true;
	}

	if (typeof err === "object" && err !== null) {
		const e = err as HttpErrorLike;

		if (typeof e.httpStatus === "number") {
			return e.httpStatus === 0 || e.httpStatus >= 500;
		}

		if (typeof e.status === "number") {
			return e.status >= 500;
		}
	}

	return false;
}

function showServerErrorNotification(message?: string): void {
	if (serverErrorVisible) return;

	const el = document.getElementById("server-error-notification");
	if (!el) return;

	el.textContent = message ?? "Serverfehler: Die Suche ist derzeit nicht verfügbar.";

	el.classList.remove("hidden");
	el.classList.add("block");

	serverErrorVisible = true;
}

function hideServerErrorNotification(): void {
	const el = document.getElementById("server-error-notification");
	if (!el) return;

	el.classList.remove("block");
	el.classList.add("hidden");

	serverErrorVisible = false;
}

/**
 * Minimal interface for a Typesense / InstantSearch client
 */
interface SearchClient {
	search(requests: unknown[]): Promise<unknown>;
}

/**
 * Attach server-error handling to a Typesense InstantSearch client
 */
export default function attachTypesenseServerErrorHandling(
	searchClient: SearchClient,
	message?: string,
	delay = 15_000,
): void {
	const originalSearch = searchClient.search.bind(searchClient);
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	searchClient.search = async function (requests: unknown[]) {
		try {
			const result = await originalSearch(requests);

			// Success → cancel pending error
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			hideServerErrorNotification();
			return result;
		} catch (err: unknown) {
			// 🔑 THIS IS THE MISSING PART
			if (!isTypesenseServerError(err)) {
				throw err;
			}

			if (!timeoutId) {
				timeoutId = setTimeout(() => {
					showServerErrorNotification(message);
				}, delay);
			}

			throw err;
		}
	};
}
