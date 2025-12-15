let serverErrorVisible = false;

function isTypesenseServerError(err) {
	// Network / fetch failure
	if (err instanceof TypeError) return true;

	if (typeof err === "object" && err !== null) {
		if ("httpStatus" in err) {
			const status = err.httpStatus;
			return status === 0 || status >= 500;
		}

		if ("status" in err) {
			const status = err.status;
			return status >= 500;
		}
	}

	return false;
}

function showServerErrorNotification(message) {
	if (serverErrorVisible) return;

	const el = document.getElementById("server-error-notification");
	if (!el) return;

	el.textContent = message || "Serverfehler: Die Suche ist derzeit nicht verfügbar.";

	el.classList.remove("hidden");
	el.classList.add("block");

	serverErrorVisible = true;
}

function hideServerErrorNotification() {
	const el = document.getElementById("server-error-notification");
	if (!el) return;

	el.classList.remove("block");
	el.classList.add("hidden");

	serverErrorVisible = false;
}

/**
 * Attach error handling to a Typesense InstantSearch client
 */
export default function attachTypesenseServerErrorHandling(searchClient, message, delay = 15000) {
	const originalSearch = searchClient.search.bind(searchClient);
	let timeoutId = null;

	searchClient.search = async function (requests) {
		try {
			const result = await originalSearch(requests);

			// success → cancel pending error
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			hideServerErrorNotification();
			return result;
		} catch (err) {
			if (!timeoutId) {
				timeoutId = setTimeout(() => {
					showServerErrorNotification(
						message || "Serverfehler: Die Suche ist derzeit nicht verfügbar.",
					);
				}, delay);
			}

			throw err;
		}
	};
}
