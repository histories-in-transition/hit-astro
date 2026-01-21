import type { Manuscript } from "@/types/manuscript";
// import { renderRegister } from "./register";
// import { renderMsDesc } from "./ms-desc";
// import { renderStrata } from "./stratum";
import { escapeXml, when } from "../utils";

export function renderManuscriptMain(ms: Manuscript): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.tei-c.org/ns/1.0 https://diglib.hab.de/rules/schema/mss/v1.0/cataloguing.xsd"
     version="5"
     xml:lang="deu">

  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>
          Beschreibung von ${escapeXml(ms.library[0]?.place?.[0]?.value)}, ${escapeXml(ms.library[0]?.abbreviation)}, ${escapeXml(ms.shelfmark)}
        </title>
        <respStmt>
          <resp>Beschrieben durch </resp>
          <name type="person">${escapeXml(ms.author_entry.join("; "))}</name>
        </respStmt>
      </titleStmt>

      <editionStmt>
        <edition>Digitale Ausgabe nach TEI P5</edition>
        <respStmt>
          <resp>TEI-P5 konforme Kodierung durch </resp>
          <name type="person">Ivana Dobcheva</name>
          <name type="org">Österreichische Akademie der Wissenschaften</name>
        </respStmt>
      </editionStmt>

      <publicationStmt>
        <publisher>
          <name type="org">Österreichische Akademie der Wissenschaften</name>
          <ptr target="www.oeaw.ac.at"/>
        </publisher>
        <date when="2025" type="issued">2025</date>
        <availability status="restricted">
          <licence target="http://creativecommons.org/licenses/by-sa/3.0/de/" notBefore="2013-03-01">
            <p>
              Dieses Dokument steht unter einer Creative Commons
              Namensnennung-Weitergabe unter gleichen Bedingungen
              3.0 Österreich Lizenz (CC BY-SA 3.0 AT).
            </p>
            <p>
              (<ref target="https://creativecommons.org/licenses/by-sa/3.0/at/">
                Copyright Information
              </ref>)
            </p>
          </licence>
        </availability>
      </publicationStmt>

     
    </fileDesc>
  </teiHeader>

  <text>
    <body>
      
    </body>
  </text>

</TEI>`;
}
