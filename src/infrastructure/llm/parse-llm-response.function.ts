/** Parses an LLM response string to extract the PR title and body. */
export function parseLlmResponse(raw: string): { body: string; title: string } {
	const titleMatch = /^TITLE:\s*(.+)$/m.exec(raw);
	const bodyMatch = /^BODY:\s*\n?([\s\S]*)$/m.exec(raw);

	const title = titleMatch?.[1]?.trim() ?? "";
	const body = bodyMatch?.[1]?.trim() ?? "";

	if (!title) {
		throw new Error("LLM response did not contain a valid TITLE line");
	}

	return { body, title };
}
