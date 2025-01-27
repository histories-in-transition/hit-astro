import type { CodUnit, Hand, Manuscript, MSItem, Stratum, Work } from "@/lib/data";
import { request } from "@acdh-oeaw/lib";

const baseUrl =
  "https://raw.githubusercontent.com/histories-in-transition/hit-baserow-dump/refs/heads/main/data/";


//////////////////////////////
////// EXPORT FUNCTIONS //////
//////////////////////////////

export function getHands() {
  return request(new URL("hands.json", baseUrl), {
    responseType: "json",
    // wrap the fetched data in an object with properties fileName - assigned here by us, and data for the actual JSON data returned
  }).then((data) => ({ fileName: "hands.json", data })) as Promise<{
    fileName: string;
    data: Array<Hand>;
  }>;
}

//

export function getManuscripts() {
  return request(new URL("manuscripts.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "manuscripts.json", data })) as Promise<{
    fileName: string;
    data: Array<Manuscript>;
  }>;
}

export function getWorks() {
  return request(new URL("works.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "works.json", data })) as Promise<{
    fileName: string;
    data: Array<Work>;
  }>;
}

export function getMsItems() {
  return request(new URL("ms_items.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "ms_items.json", data })) as Promise<{
    fileName: string;
    data: Array<MSItem>;
  }>;
}

export function getScribes() {
  return request(new URL("scribes.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "scribes.json", data })) as Promise<{
    fileName: string;
    data: Array<MSItem>;
  }>;
}

export function getStrata() {
  return request(new URL("strata.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "strata.json", data })) as Promise<{
    fileName: string;
    data: Array<Stratum>;
  }>;
}

export function getCodUnits() {
  return request(new URL("cod_units.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "cod_units.json", data })) as Promise<{
    fileName: string;
    data: Array<CodUnit>;
  }>;
}