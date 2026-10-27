import type { Manuscript } from "@/types";
import { makeMsDesc } from "./ms_desc.ts";
import { makeRegister } from "./register.ts";
import { makeStrata } from "./strata.ts";

export function mainTei(ms: Manuscript) {
	return `
    <TEI xmlns="http://www.tei-c.org/ns/1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.tei-c.org/ns/1.0 https://diglib.hab.de/rules/schema/mss/v1.0/cataloguing.xsd"
    version="5" xml:lang="deu">
        <teiHeader>
            <fileDesc>
                <titleStmt>
                    <title>Beschreibung von ${ms.view_label}</title>
                    <respStmt>
                        <resp>Beschrieben durch </resp>
                        <name type="person">${ms.author_entry.join(", ")}</name>
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
                    <distributor></distributor>
                    <availability status="restricted">
                        <licence target="http://creativecommons.org/licenses/by-sa/3.0/de/" notBefore="2013-03-01">
                            <p>Dieses Dokument steht unter einer Creative Commons Namensnennung-Weitergabe unter gleichen Bedingungen 3.0 Österreich Lizenz (CC BY-SA 3.0 AT).</p>
                            <p> (<ref target="https://creativecommons.org/licenses/by-sa/3.0/at/">Copyright Information</ref>)</p>
                        </licence>
                    </availability>
                    <pubPlace>
                        <!--<ptr type="purl" target="http://"/>-->
                    </pubPlace>
                </publicationStmt>
                <sourceDesc>
                    ${makeRegister(ms)}
                    ${makeMsDesc(ms)}
                </sourceDesc>
            </fileDesc>
        </teiHeader>
        <text>
            <body>
                ${ms.strata.length && makeStrata(ms)}
            </body>
        </text>
    </TEI>
    `;
}
