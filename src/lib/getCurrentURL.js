if (typeof window !== "undefined") {
	// Get the full URL including protocol, domain, path, and query parameters
	const fullUrl = window.location.href;
	// Insert the full URL into the <span> element
	const placeholder = document.querySelector("#pathname-placeholder");
	if (placeholder) {
		placeholder.textContent = fullUrl;
	}
}
