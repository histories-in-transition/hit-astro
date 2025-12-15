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
export default function attachTypesenseServerErrorHandling(searchClient, message) {
	// 🔒 DO NOTHING on import — only when called

	const originalSearch = searchClient.search.bind(searchClient);

	searchClient.search = async function (requests) {
		try {
			const result = await originalSearch(requests);

			// Success → hide error
			hideServerErrorNotification();

			return result;
		} catch (err) {
			if (isTypesenseServerError(err)) {
				showServerErrorNotification(message);
			}
			throw err;
		}
	};

	// Attach online/offline listeners ONLY when function is called
	window.addEventListener("offline", () => {
		showServerErrorNotification("Keine Internetverbindung. Bitte überprüfen Sie Ihre Verbindung.");
	});

	window.addEventListener("online", () => {
		hideServerErrorNotification();
	});
}
