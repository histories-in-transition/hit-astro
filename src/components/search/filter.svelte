<script lang="ts">
import { filters } from "@/stores/hit_store.ts";

export let title: string;
export let items: { name: string; count?: number }[];
export let field: string;   // which filter field to update

let query = "";
let visibleCount = 5;
$: currentFilters = $filters;

$: filteredItems = items
  .filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (currentFilters[field] ?? []).includes(a.name)
  );

$: visibleItems = filteredItems.slice(0, visibleCount)

function toggle(name: string) {

  const value = name;

 filters.update(f => {
  const list = f[field] ?? [];

  return {
    ...f,
    [field]: list.includes(value)
      ? list.filter(v => v !== value)
      : [...list, value].sort()
  };
});
}

function showMore() {
  visibleCount += 5;
}
</script>

<div class="text-xs border border-neutral-200 shadow-xs rounded-md p-2">
<details>
  <summary class="flex justify-between gap-2 font-semibold cursor-pointer uppercase">
    <h3 class="font-semibold ">{title}</h3>
    <svg
        class="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"                >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </summary>
  <div class="max-h-72 overflow-y-auto pr-1">
 <input
    type="search"
    aria-label={`Search ${title}`}
    bind:value={query}
    placeholder={`Suche ...`}
    class="mt-2 p-2 border border-neutral-300 rounded-md w-full bg-white"
  />

  <ul class="mt-2 space-y-1">
    {#each visibleItems as item}
      <li>
        <label for={`${field}-${item.name}`} class="flex items-center gap-2">
         <input
            id={`${field}-${item.name}`}
            type="checkbox"
            checked={currentFilters[field].includes(item.name)}
            on:change={() => toggle(item.name)}
            />
          <span>
            {item.name}
            {#if item.count}
                <span class="text-neutral-700">({item.count})</span>
            {/if}
            </span>
        </label>
      </li>
    {/each}
  </ul>
   {#if visibleCount < filteredItems.length}
      <button
        type="button"
        on:click={showMore}
        class="mt-2 text-brand-700 cursor-pointer underline underline-offset-2 hover:to-brand-500"
      >
        Show more
      </button>
    {/if}
  </div>
</details>
</div>