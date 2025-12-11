import { withBasePath } from "./withBasePath";

const searchForm = document.querySelector<HTMLFormElement>("#searchForm");
const searchInput = document.querySelector<HTMLInputElement>("#searchInput");

searchForm.addEventListener("submit", (event: SubmitEvent) => {
	event.preventDefault();
	const searchValue = searchInput.value.trim();
	if (searchValue) {
		window.location.href = withBasePath(`/search/?hit__msitems[query]=${searchValue}`);
	} else {
		window.location.href = withBasePath(`/search/`);
	}
});
