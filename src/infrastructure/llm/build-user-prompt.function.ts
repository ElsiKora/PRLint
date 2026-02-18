import type { IPrContext } from "../../domain/interface/pr-context.interface";

import { MAX_DIFF_LENGTH } from "../../domain/constant/numeric.constant";

/**
 * Builds the user-facing prompt message from PR context for LLM generation.
 * @param {IPrContext} context - Collected PR context including branch, files, and diff.
 * @returns {string} Formatted prompt string for LLM consumption.
 */
export function buildUserPrompt(context: IPrContext): string {
	const parts: Array<string> = [];

	parts.push(`Branch: ${context.branch}`);

	if (context.ticketId) {
		parts.push(`Ticket ID: ${context.ticketId}`);
	}

	if (context.templateType) {
		parts.push(`PR template type: ${context.templateType}`);
	}

	if (context.requiredSections && context.requiredSections.length > 0) {
		const sectionLines: string = context.requiredSections.map((section: string, index: number) => `  ${String(index + 1)}. ${section}`).join("\n");
		parts.push(`Required sections (in order):\n${sectionLines}`);
	}

	if (context.files.length > 0) {
		const fileLines: string = context.files.map((file: string) => `  - ${file}`).join("\n");
		parts.push(`Changed files:\n${fileLines}`);
	}

	if (context.title) {
		parts.push(`Current title: ${context.title}`);
	}

	if (context.body) {
		parts.push(`Current body:\n${context.body}`);
	}

	if (context.diff) {
		const truncatedDiff: string = context.diff.length > MAX_DIFF_LENGTH ? context.diff.slice(0, MAX_DIFF_LENGTH) + "\n... (diff truncated)" : context.diff;
		parts.push(`Diff:\n${truncatedDiff}`);
	}

	return parts.join("\n\n");
}
