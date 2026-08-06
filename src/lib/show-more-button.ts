document.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLElement)) return;

	const toggleBtn = target.closest("[data-showmore-btn]");
	if (!(toggleBtn instanceof HTMLElement)) return;

	//find the closest preceding list with data-showmore-list
	let list = document.querySelector("[data-showmore-list]");
	while (list && !(list instanceof HTMLElement && list.matches("[data-showmore-list]"))) {
		list = list.previousElementSibling;
	}

	if (!(list instanceof HTMLElement)) return;

	const extraItems = list.querySelectorAll<HTMLElement>("[data-showmore-item]");
	if (extraItems.length === 0) return;

	const isHidden = extraItems[0].classList.contains("hidden");
	extraItems.forEach((li) => li.classList.toggle("hidden"));
	toggleBtn.textContent = isHidden ? "Weniger anzeigen" : "Mehr anzeigen";
	toggleBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
});
