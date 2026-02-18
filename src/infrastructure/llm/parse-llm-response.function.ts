/**
 * Parses an LLM response string to extract the PR title and body.
 * @param {string} raw - Raw LLM output containing TITLE and BODY markers.
 * @returns {{ body: string; title: string }} Parsed title and body.
 */
export function parseLlmResponse(raw: string): { body: string; title: string } {
	const titleMatch: null | RegExpExecArray = /^TITLE:(.+)$/m.exec(raw);
	const bodyMatch: null | RegExpExecArray = /^BODY:([\s\S]*)$/m.exec(raw);

	const title: string = titleMatch?.[1]?.trim() ?? "";
	const body: string = bodyMatch?.[1]?.trim() ?? "";

	if (!title) {
		throw new Error("LLM response did not contain a valid TITLE line");
	}

	return { body, title };
}
