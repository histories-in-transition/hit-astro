import type { Manuscript } from "@/types";
export function prepareDataForStrataGraph(manuscript: Manuscript) {
	//collect all msitems from the hand_roles and enrich them with locusArray from cod_units
	const msitems = manuscript.strata.flatMap((st) =>
		st.hand_roles.flatMap((hr) =>
			hr.ms_item.map((msi) => {
				const codUnitContent = manuscript.cod_units
					.flatMap((cu) => cu.content)
					.find((contentItem) => contentItem.hit_id === msi.hit_id);

				const locusArray = codUnitContent?.locusArray ?? [];

				const pages = locusArray.flatMap((locus) => [
					Number(locus.begin[0].facs_number),
					Number(locus.end[0].facs_number),
				]);

				return {
					hit_id: msi.hit_id,
					locusArray,

					pageStart: pages.length ? Math.min(...pages) : undefined,
					pageEnd: pages.length ? Math.max(...pages) : undefined,

					dateStart: codUnitContent.orig_date[0]?.not_before
						? Number(codUnitContent.orig_date[0].not_before)
						: undefined,
					dateEnd: codUnitContent.orig_date[0]?.not_after
						? Number(codUnitContent.orig_date[0].not_after)
						: undefined,

					stratum_number: st.number,
					character: st.character,
					title: msi.author[0] ? `${msi.author[0]}: ${msi.title}` : msi.title,
				};
			}),
		),
	);
	const handRoles = manuscript.strata.flatMap((st) =>
		st.hand_roles.map((hr) => {
			const date = hr.hand[0]?.date?.[0];

			const msItemIds = hr.ms_item.map((i) => i.hit_id);

			const pages = msitems
				.filter((msi) => msItemIds.includes(msi.hit_id))
				.flatMap((msi) => [msi.pageStart, msi.pageEnd])
				.filter((page): page is number => page !== undefined);

			return {
				hit_id: hr.hit_id,

				dateStart: date?.not_before ? Number(date.not_before) : undefined,

				dateEnd: date?.not_after ? Number(date.not_after) : undefined,

				msItemIds,

				pageStart: pages.length > 0 ? Math.min(...pages) : undefined,
				pageEnd: pages.length > 0 ? Math.max(...pages) : undefined,
			};
		}),
	);
	return msitems;
}
