export interface Stratum {
    id:                 number;
    label:              LabelElement[];
    character:          Material[];
    manuscript:         LabelElement[];
    number:             string;
    hit_id:             string;
    hand_role:          HandRole[];
    note:               string;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    strata_filiation:   LabelElement[];
    view_label:         string;
    prev:               Next;
    next:               Next;
}

export interface LastModifiedBy {
    id:   number;
    name: LastModifiedByName;
}

export type LastModifiedByName = string;

export interface Material {
    id:    number;
    value: string;
    color: string;
}

export interface HandRole {
    id:                   number;
    hit_id:               string;
    hand:                 LabelElement[];
    ms_item:              MSItem[];
    role:                 Material[];
    locus:                string;
    text:                 Text[];
    locus_text:           LabelElement[];
    "Last modified by":   LastModifiedBy;
    "Last modified":      Date;
    locus_layout:         any[];
    function:             any[];
    bezug_msitem:         any[];
    role_to_bezug_msitem: any[];
}

export interface LabelElement {
    id:    number;
    value: string;
}

export interface MSItem {
    id:                 number;
    label:              LabelElement[];
    incipit:            string;
    explicit:           string;
    rubric:             string;
    title_work:         Work[];
    title_note:         string;
    bibl:               any[];
    final_rubric:       string;
    siglum:             string;
    hit_id:             string;
    filiation:          any[];
    locus_grp:          string;
    hands_role:         MSItemHandsRole[];
    cod_unit:           CodUnitElement[];
    "Last modified":    Date;
    "Last modified by": LastModifiedBy;
    note:               null;
    hand:               labelElement2[];
    decoration:         Material[];
    facs_url:           string;
    form:               any[];
    form_note:          null;
    column:             any[];
    manuscript:        Manuscript[];
    view_label:        string;
    prev:              Next;
    next:              Next;
}

export interface CodUnitElement {
    id:                      number;
    label:                   labelElement2[];
    notes:                   string;
    hit_id:                  string;
    locus:                   string;
    manuscript:              LabelElement[];
    quire:                   Quire[];
    number:                  string;
    prov_place_old:          LabelElement[];
    "Last modified by":      LastModifiedBy;
    "Last modified":         Date;
    orig_date:               LabelElement[];
    quires_number:           null | string;
    heigth:                  null | string;
    lines_number:            null | string;
    decorations:             string;
    codicological_reworking: any[];
    basic_structure:         any[];
    written_width:           null | string;
    written_height:          null | string;
    width:                   null | string;
    columns:                 Material[];
    cod_unit_placed:         CodUnitPlaced[];
    prov_place:              labelElement2[];
}

export interface CodUnitPlaced {
    id:           number;
    hit_id:       string;
    cod_unit:     LabelElement[];
    place:        OrigPlace[];
    from:         LabelElement[];
    type:         Material[];
    till:         LabelElement[];
    ms:           LabelElement[];
    authority:    LabelElement[];
    page:         string | null;
    certain_from: boolean;
    ceratin_till: boolean;
}


export interface OrigPlace {
    id:                 number;
    name:               string;
    geonames_url:       string;
    hit_id:             string;
    wikidata_url:       string;
    country:            OrigPlace[];
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
}

export interface labelElement2 {
    ids:   any;
    value: string;
}


export interface Quire {
    id:                 number;
    label:              labelElement2[];
    hit_id:             string;
    number:             string;
    locus:              string;
    library:            labelElement2[];
    locus_from:         string;
    locus_to:           string;
    manuscript:         LabelElement[];
    quiremark:          null | string;
    written_height:     null | string;
    written_width:      null | string;
    written:            string;
    hair_flesh:         Material[];
    ruling:             string;
    column:             Material[];
    note:               string;
    decoration:         string;
    quire_structure:    string;
    correct_number:     null;
    height:             null | string;
    width:              null | string;
    catchwords:         boolean;
    stratum:            LabelElement[];
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    cod_units:          LabelElement[];
    besonderheiten:     any[];
}


export interface MSItemHandsRole {
    id:                   number;
    hit_id:               string;
    hand:                 LabelElement[];
    ms_item:              LabelElement[];
    role:                 Material[];
    locus:                string;
    text:                 labelElement2[];
    locus_text:           LabelElement[];
    "Last modified by":   LastModifiedBy;
    "Last modified":      Date;
    locus_layout:         Material[];
    function:             Material[];
    bezug_msitem:         any[];
    role_to_bezug_msitem: Material[];
}
 

export interface LibraryFullElement {
    id:                 number;
    label:              string;
    hit_id:             string;
    gnd_url:            string;
    library_full:       string;
    library_website:    string;
    settlement:         Settlement[];
    wikidata:           string;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
}

export interface Settlement {
    id:                 number;
    name:               string;
    geonames_url:       string;
    hit_id:             string;
    wikidata_url:       string;
    country:            LabelElement[];
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
}

export interface ManuscriptsDated {
    id:                 number;
    hit_id:             ManuscriptsDatedHitID;
    manuscript:         LabelElement[];
    date:               DateElement[];
    authority:          Authority[];
    page:               string;
    preferred_date:     boolean;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    note:               null | string;
}

export interface Authority {
    id:          number;
    name:        string;
    short_title: string;
    zotero_id:   string;
    hit_id:      string;
}

export interface DateElement {
    id:                 number;
    label:              string;
    not_before:         Date | null;
    hit_id:             string;
    not_after:          Date | null;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
}

export type ManuscriptsDatedHitID = string;

export interface Next {
    id:    string;
    label: string;
}

export interface Work {
    id:                 number;
    title:              string;
    gnd_url:            string;
    note:               string;
    hit_id:             string;
    author:             Author[];
    bibliography:       any[];
    source_text:        any[];
    genre:              Genre[];
    note_source:        null | string;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    view_label:        string;
    prev:              Next;
    next:              Next;
    related__ms_items?: MSItem[];
}

export interface Author {
    id:                 number;
    name:               string;
    gnd_url:            string;
    hit_id:             string;
    role:               Material[];
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    works:              LabelElement[];
    work:               LabelElement[];
}

export interface Genre {
    id:                 number;
    genre:              string;
    hit_id:             string;
    main_genre:         Genre[];
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
}

export interface Scribe {
    id:                 number;
    name:               string;
    hit_id:             string;
    description:        string;
    group:              boolean;
    hands:              any[];
    hand:               labelElement2[];
    "Last modified":    Date;
    "Last modified by": LastModifiedBy;
    view_label:         string;
    prev:               Next;
    next:               Next;
}

export interface PurpleHand {
    id:                 number;
    label:              labelElement2[];
    description:        string;
    hit_id:             string;
    similar_hands:      any[];
    nr_daniel:          string;
    manuscript:         LabelElement[];
    number:             string;
    note:               string;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    hands_role:         HandHandsRole[];
    role:               Role[];
    texts:              Text[];
    hands_dated:        HandsDated[];
    dating:             labelElement2[];
    hands_placed:       any[];
    scribe:             ScribeElement[];
    gruppe:             boolean;
}

export interface HandsDated {
    id:                 number;
    hit_id:             string;
    authority:          any[];
    page:               string;
    dated:              DateElement[];
    hand:               LabelElement[];
    new_dating:         boolean;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    note:               string;
}

export interface HandHandsRole {
    id:                   number;
    hit_id:               string;
    hand:                 LabelElement[];
    ms_item:              MSItem[];
    role:                 Material[];
    locus:                string;
    text:                 Text[];
    locus_text:           LabelElement[];
    "Last modified by":   LastModifiedBy;
    "Last modified":      Date;
    locus_layout:         any[];
    function:             Material[];
    bezug_msitem:         any[];
    role_to_bezug_msitem: any[];
}

export interface Manuscript {
    id:                      number;
    shelfmark:               LabelElement[];
    hit_id:                  string;
    library:                 LabelElement[];
    manuscripta_url:         string;
    handschriftenportal_url: string;
    catalog_url:             string;
    digi_url:                string;
    idno:                    string;
    idno_former:             string;
    quire_structure:         string;
    library_full:            LibraryFullElement[];
    extent:                  string;
    foliation:               string;
    acc_mat:                 string | null;
    binding:                 string;
    binding_date:            LabelElement[];
    history:                 string;
    bibliography:            any[];
    height:                  string;
    width:                   string;
    material_spec:           string;
    orig_place:              OrigPlace[];
    catchwords:              string;
    quiremarks:              string;
    material:                Material;
    provenance:              LibraryFullElement[];
    manuscripts_dated:       ManuscriptsDated[];
    orig_dated:              labelElement2[];
    "Last modified by":      LastModifiedBy;
    "Last modified":         Date;
    content_summary:         null | string;
    charakter:               Material[];
    case_study:              Material[];
    status:                  Material[];
    view_label:             string;
    prev:                   Next;
    next:                   Next;
    related__cod_units:     CodUnit[];
}

export interface CodUnit {
    id:                      number;
    label:                   labelElement2[];
    notes:                   string;
    hit_id:                  string;
    locus:                   string;
    manuscript:              LabelElement[];
    quire?:                   Quire[];
    number:                  string;
    prov_place_old:          LabelElement[];
    "Last modified by":      LastModifiedBy;
    "Last modified":         Date;
    orig_date:               LabelElement[];
    quires_number:           null | string;
    heigth:                  null | string;
    lines_number:            null | string;
    decorations:             string;
    codicological_reworking: any[];
    basic_structure:         any[];
    written_width:           null | string;
    written_height:          null | string;
    width:                   null | string;
    columns:                 Material[];
    cod_unit_placed:         CodUnitPlaced[];
    prov_place:              labelElement2[];
    view_label?:             string;
    prev?:                   Next;
    next?:                   Next;
    related__ms_items?:      any[];
}

export interface Role {
    id:    number;
    value: Material[];
}

export interface ScribeElement {
    id:                 number;
    name:               string;
    hit_id:             string;
    description:        string;
    group:              boolean;
    hands:              LabelElement[];
    hand:               labelElement2[];
    "Last modified":    Date;
    "Last modified by": LastModifiedBy;
}

export interface Hand {
    id:                 number;
    label:              labelElement2[];
    description:        string;
    hit_id:             string;
    similar_hands:      LabelElement[];
    nr_daniel:          string;
    manuscript:         LabelElement[];
    number:             string;
    note:               string;
    "Last modified by": LastModifiedBy;
    "Last modified":    Date;
    hands_role:         HandHandsRole[];
    role:               Role[];
    texts:              Text[];
    hands_dated:        HandsDated[];
    dating:             labelElement2[];
    hands_placed:       any[];
    scribe:             any[];
    gruppe:             boolean;
    view_label:         string;
    prev:               Next;
    next:               Next;
}
