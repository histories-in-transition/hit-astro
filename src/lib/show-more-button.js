document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("[data-showmore-btn]").forEach((toggleBtn) => {
		toggleBtn.addEventListener("click", () => {
			// Find the closest ul with data-showmore-list before or after the button
			let list = toggleBtn.previousElementSibling;
			while (list && !list.matches("[data-showmore-list]")) {
				list = list.previousElementSibling;
			}
			if (!list) return;

			const extraItems = list.querySelectorAll("[data-showmore-item]");
			if (extraItems.length === 0) return;

			const isHidden = extraItems[0].classList.contains("hidden");
			extraItems.forEach((li) => li.classList.toggle("hidden"));
			toggleBtn.textContent = isHidden ? "Show less" : "Show more";
			toggleBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
		});
	});
});
