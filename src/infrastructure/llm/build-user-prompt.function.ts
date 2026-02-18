import type { IPrContext } from "../../domain/interface/pr-context.interface";

/** Builds the user-facing prompt message from PR context for LLM generation. */
export function buildUserPrompt(context: IPrContext): string {
	const parts: Array<string> = [];

	parts.push(`Branch: ${context.branch}`);

	if (context.ticketId) {
		parts.push(`Ticket ID: ${context.ticketId}`);
	}

	if (context.files.length > 0) {
		parts.push(`Changed files:\n${context.files.map((f) => `  - ${f}`).join("\n")}`);
	}

	if (context.title) {
		parts.push(`Current title: ${context.title}`);
	}

	if (context.body) {
		parts.push(`Current body:\n${context.body}`);
	}

	if (context.diff) {
		const truncatedDiff = context.diff.length > 12_000 ? context.diff.slice(0, 12_000) + "\n... (diff truncated)" : context.diff;
		parts.push(`Diff:\n${truncatedDiff}`);
	}

	return parts.join("\n\n");
}
