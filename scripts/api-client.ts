import { request } from "@acdh-oeaw/lib";

const baseUrl =
  "https://raw.githubusercontent.com/histories-in-transition/hit-baserow-dump/refs/heads/main/data/";

//

// types were generated with quicktype.io

export interface Stratum {
  id: number;
  order: string;
  label: LabelElement[];
  character: Material[];
  manuscript: LabelElement[];
  number: string;
  hit_id: string;
  hand_role: HandRole[];
  ms_items: TextElement[];
  quires: LabelElement[];
  locus: LabelElement[];
  note: string;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export interface EdBy {
  id: number;
  name: CreatedByName;
}

export type CreatedByName = string;

export interface Material {
  id: number;
  value: string;
  color: Color;
}

export type Color = string;

export interface HandRole {
  id: number;
  order: string;
  hit_id: string;
  hand: LabelElement[];
  ms_item: MSItem[];
  role: Material[];
  locus: string;
  text: TextElement[];
  locus_text: LabelElement[];
  "Last modified by": EdBy;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified": Date;
  locus_layout: Material[];
  function: Material[];
}

export interface LabelElement {
  id: number;
  value: string;
}

export interface MSItem {
  id: number;
  order: string;
  label: LabelElement[];
  manuscript: Manuscript[];
  incipit: string;
  explicit: string;
  rubric: string;
  title_work: Work[];
  title_note: string;
  bibl: any[];
  final_rubric: string;
  siglum: string;
  hit_id: string;
  filiation: any[];
  locus_grp: string;
  hands_role: MSItemHandsRole[];
  cod_unit: CodUnit[];
  "Last modified": Date;
  "Created on": Date;
  "Created by": EdBy;
  "Last modified by": EdBy;
  note: null | string;
  hand: HandElement[];
  decoration: Material[];
  facs_url: string;
  form: any[];
  form_note: null;
}

export interface CodUnit {
  id: number;
  order: string;
  label: HandElement[];
  notes: string;
  hit_id: string;
  locus: string;
  manuscript: LabelElement[];
  quire: Quire[];
  number: string;
  prov_place: OrigPlace[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
  date: LabelElement[];
}

export interface HandElement {
  ids: HandIDS;
  value: string;
}

export interface HandIDS {
  database_table_3487: number;
  database_table_3488: number;
}

export interface OrigPlace {
  id: number;
  order: string;
  name: OrigPlaceName;
  geonames_url: string;
  hit_id: OrigPlaceHitID;
  wikidata_url: string;
  country: OrigPlace[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export type OrigPlaceHitID = string;

export type OrigPlaceName = string;

export interface Quire {
  id: number;
  order: string;
  label: HandElement[];
  hit_id: string;
  number: string;
  locus: string;
  library: HandElement[];
  locus_from: string;
  locus_to: string;
  manuscript: LabelElement[];
  quiremark: null | string;
  written_height: null | string;
  written_width: null | string;
  written: Written;
  hair_flesh: Material[];
  ruling: string;
  column: Material[];
  note: string;
  decoration: string;
  quire_structure: QuireStructure;
  correct_number: null | string;
  height: null | string;
  width: null | string;
  catchwords: boolean;
  stratum: LabelElement[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
  cod_units: LabelElement[];
  besonderheiten: any[];
}

export type QuireStructure = string;

export type Written = string;

export interface MSItemHandsRole {
  id: number;
  order: string;
  hit_id: string;
  hand: LabelElement[];
  ms_item: LabelElement[];
  role: Material[];
  locus: null | string;
  text: TextElement[];
  locus_text: LabelElement[];
  "Last modified by": EdBy;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified": Date;
  locus_layout: Material[];
  function: Material[];
}

export interface TextElement {
  ids: MSItemIDS;
  value: string;
}

export interface MSItemIDS {
  database_table_3489: number;
  database_table_3491: number;
}

export interface Manuscript {
  id: number;
  order: string;
  shelfmark: LabelElement[];
  hit_id: ManuscriptHitID;
  library: LabelElement[];
  manuscripta_url: string;
  handschriftenportal_url: string;
  catalog_url: string;
  digi_url: string;
  idno: Idno;
  idno_former: IdnoFormer | null;
  quire_structure: string;
  library_full: LibraryFullElement[];
  extent: string;
  foliation: null | string;
  acc_mat: null | string;
  binding: string;
  binding_date: LabelElement[];
  history: string;
  bibliography: any[];
  height: null | string;
  width: null | string;
  material_spec: string;
  orig_place: OrigPlace[];
  catchwords: null | string;
  quiremarks: null | string;
  material: Material;
  provenance: LibraryFullElement[];
  manuscripts_dated: SDated[];
  orig_dated: OrigDated[];
  "Created by": EdBy;
  "Last modified by": EdBy;
  "Created on": Date;
  "Last modified": Date;
  content_summary: null | string;
  view_label?: string;
}

export type ManuscriptHitID = string;

export type Idno = string;

export type IdnoFormer = string;

export interface LibraryFullElement {
  id: number;
  order: string;
  label: LabelEnum;
  hit_id: LibraryFullHitID;
  gnd_url: string;
  library_full: LibraryFullEnum;
  library_website: string;
  settlement: Settlement[];
  wikidata: string;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export type LibraryFullHitID = string;

export type LabelEnum = string;

export type LibraryFullEnum = string;

export interface Settlement {
  id: number;
  order: string;
  name: SettlementName;
  geonames_url: string;
  hit_id: SettlementHitID;
  wikidata_url: string;
  country: LabelElement[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export type SettlementHitID = string;

export type SettlementName = string;

export interface SDated {
  id: number;
  order: string;
  hit_id: string;
  manuscript?: LabelElement[];
  date?: DateElement[];
  authority: Authority[];
  page: string;
  preferred_date?: boolean;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
  note: null | string;
  dated?: DateElement[];
  hand?: LabelElement[];
  new_dating?: boolean;
}

export interface Authority {
  id: number;
  order: string;
  name: AuthorityName;
  short_title: string;
  zotero_id: string;
}

export type AuthorityName = string;

export interface DateElement {
  id: number;
  order: string;
  label: string;
  not_before: Date | null;
  hit_id: string;
  not_after: Date | null;
  "Created by": EdBy;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export interface OrigDated {
  ids: OrigDatedIDS;
  value: string;
}

export interface OrigDatedIDS {
  database_table_3512: number;
  database_table_3516: number;
}

export interface Work {
  id: number;
  order: string;
  title: string;
  gnd_url: string;
  note: string;
  hit_id: string;
  author: Author[];
  bibliography: any[];
  source_text: SourceText[];
  genre: Genre[];
  note_source: NoteSource | null;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export interface Author {
  id: number;
  order?: string;
  name?: string;
  gnd_url?: string;
  hit_id?: string;
  role?: Material[];
  "Created by"?: EdBy;
  "Created on"?: Date;
  "Last modified by"?: EdBy;
  "Last modified"?: Date;
  works?: LabelElement[];
  work?: LabelElement[];
  hands?: LabelElement[];
  identical_hands?: HandElement[];
  value?: string;
}

export interface Genre {
  id: number;
  order?: string;
  genre?: string;
  hit_id?: string;
  main_genre?: MainGenre[];
  "Created by"?: EdBy;
  "Created on"?: Date;
  "Last modified by"?: EdBy;
  "Last modified"?: Date;
  value?: string;
}

export interface MainGenre {
  id: number;
  order: string;
  genre: string;
  hit_id: string;
  main_genre: MainGenre[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
}

export type NoteSource = string;

export interface SourceText {
  id: number;
  order?: string;
  title?: string;
  gnd_url?: string;
  note?: string;
  hit_id?: string;
  author?: LabelElement[];
  bibliography?: any[];
  source_text?: LabelElement[];
  genre?: LabelElement[];
  note_source?: NoteSource | null;
  "Created by"?: EdBy;
  "Created on"?: Date;
  "Last modified by"?: EdBy;
  "Last modified"?: Date;
  value?: string;
}

export interface Hand {
  id: number;
  order: string;
  label: HandElement[];
  description: string;
  scribe_old: LabelElement[];
  hit_id: string;
  similar_hands: LabelElement[];
  nr_daniel: null | string;
  manuscript: LabelElement[];
  number: null | string;
  note: null | string;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
  hands_role: HandHandsRole[];
  role: Role[];
  texts: TextElement[];
  hands_dated: SDated[];
  dating: Dating[];
  hands_placed: HandsPlaced[];
  scribe: Scribe[];
  view_label: string;
}

export interface Dating {
  ids: DatingIDS;
  value: string;
}

export interface DatingIDS {
  database_table_3512: number;
  database_table_3520: number;
}

export interface HandsPlaced {
  id: number;
  order: string;
  hit_id: string;
  hand: LabelElement[];
  authority: Authority[];
  page: string;
  place: OrigPlace[];
  "Last modified by": EdBy;
}

export interface HandHandsRole {
  id: number;
  order: string;
  hit_id: string;
  hand: LabelElement[];
  ms_item: PurpleMSItem[];
  role: Material[];
  locus: null | string;
  text: TextElement[];
  locus_text: LabelElement[];
  "Last modified by": EdBy;
  "Created by": EdBy;
  "Created on": Date;
  "Last modified": Date;
  locus_layout: Material[];
  function: Material[];
}

export interface PurpleMSItem {
  id: number;
  order: string;
  label: LabelElement[];
  manuscript: ManuscriptElement[];
  incipit: string;
  explicit: string;
  rubric: string;
  title_work: Work[];
  title_note: string;
  bibl: any[];
  final_rubric: string;
  siglum: string;
  hit_id: string;
  filiation: any[];
  locus_grp: string;
  hands_role: MSItemHandsRole[];
  cod_unit: CodUnit[];
  "Last modified": Date;
  "Created on": Date;
  "Created by": EdBy;
  "Last modified by": EdBy;
  note: null | string;
  hand: HandElement[];
  decoration: Material[];
  facs_url: string;
  form: any[];
  form_note: null;
}

export interface ManuscriptElement {
  id: number;
  order: string;
  shelfmark: LabelElement[];
  hit_id: ManuscriptHitID;
  library: LabelElement[];
  manuscripta_url: string;
  handschriftenportal_url: string;
  catalog_url: string;
  digi_url: string;
  idno: Idno;
  idno_former: IdnoFormer | null;
  quire_structure: string;
  library_full: LibraryFullElement[];
  extent: string;
  foliation: null | string;
  acc_mat: null | string;
  binding: string;
  binding_date: LabelElement[];
  history: string;
  bibliography: any[];
  height: string;
  width: string;
  material_spec: string;
  orig_place: OrigPlace[];
  catchwords: string;
  quiremarks: string;
  material: Material;
  provenance: LibraryFullElement[];
  manuscripts_dated: SDated[];
  orig_dated: OrigDated[];
  "Created by": EdBy;
  "Last modified by": EdBy;
  "Created on": Date;
  "Last modified": Date;
  content_summary: null | string;
}

export interface Role {
  id: number;
  value: Material[];
}

export interface Scribe {
  id: number;
  order: string;
  name: string;
  gnd_url: string;
  hit_id: string;
  role: Material[];
  "Created by": EdBy;
  "Created on": Date;
  "Last modified by": EdBy;
  "Last modified": Date;
  works: LabelElement[];
  work: LabelElement[];
  hands: LabelElement[];
  identical_hands: HandElement[];
}

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

export function getStrata() {
  return request(new URL("strata.json", baseUrl), {
    responseType: "json",
  }).then((data) => ({ fileName: "strata.json", data })) as Promise<{
    fileName: string;
    data: Array<Stratum>;
  }>;
}
