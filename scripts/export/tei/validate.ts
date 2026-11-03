import { execFileSync } from "node:child_process";

import { DOMParser } from "@xmldom/xmldom";
import { XMLValidator } from "fast-xml-parser";

export interface ValidationResult {
	success: boolean;
	errors: string[];
}

const ok: ValidationResult = { success: true, errors: [] };

function fail(...errors: string[]): ValidationResult {
	return { success: false, errors };
}

/** Is the XML syntactically correct (all tags closed, valid characters, ...)? */
export function checkWellFormed(xml: string): ValidationResult {
	const result = XMLValidator.validate(xml);
	if (result === true) return ok;

	const { msg, line, col } = result.err;
	return fail(`${msg} (line ${line}, column ${col})`);
}

/** Validates a file on disk against the TEI schema, using the `xmllint` command line tool. */
export function validateAgainstSchema(xmlFilePath: string, schemaPath: string): ValidationResult {
	try {
		execFileSync("xmllint", ["--noout", "--schema", schemaPath, xmlFilePath], {
			stdio: "pipe",
			encoding: "utf-8",
		});
		return ok;
	} catch (error) {
		const e = error as { stderr?: string; stdout?: string; message: string };
		const output = e.stderr || e.stdout || e.message;

		const errors = output
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line.length > 0 && !line.includes("validates"));

		return fail(...(errors.length > 0 ? errors : ["Schema validation failed"]));
	}
}

/** Very basic fallback when xmllint is not available: is the TEI skeleton there? */
export function validateTeiStructure(xml: string): ValidationResult {
	const doc = new DOMParser().parseFromString(xml, "application/xml");
	const errors: string[] = [];

	if (doc.documentElement?.tagName !== "TEI") {
		errors.push("Root element must be <TEI>");
	}

	for (const name of ["teiHeader", "text", "fileDesc", "sourceDesc", "msDesc"]) {
		if (doc.getElementsByTagName(name).length === 0) {
			errors.push(`Missing required element: <${name}>`);
		}
	}

	return errors.length === 0 ? ok : fail(...errors);
}
