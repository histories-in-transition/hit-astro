import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const hands = defineCollection({
	loader: file("./src/content/data/hands.json"),
	schema: z.object({}),
});

const manuscripts = defineCollection({
	loader: file("./src/content/data/manuscripts.json"),
	schema: z.object({}),
});

const ms_items = defineCollection({
	loader: file("./src/content/data/ms_items.json"),
	schema: z.object({}),
});

const scribes = defineCollection({
	loader: file("./src/content/data/scribes.json"),
	schema: z.object({}),
});

const works = defineCollection({
	loader: file("./src/content/data/works.json"),
	schema: z.object({}),
});

//  Export a single `collections` object to register your collection(s)
export const collections = {
	ms_items,
	works,
	scribes,
	hands,
	manuscripts,
};
