import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";

import { JSON_INDENT } from "../../domain/constant/numeric.constant";

/** Formats domain results as JSON strings for machine consumption. */
export const JsonPresenter: { presentContext: (context: IPrContext) => string; presentLintResult: (result: IPrLintResult) => string } = {
	/**
	 * @param {IPrContext} context - PR context to serialize.
	 * @returns {string} JSON string.
	 */
	presentContext(context: IPrContext): string {
		return JSON.stringify(context, null, JSON_INDENT);
	},

	/**
	 * @param {IPrLintResult} result - Lint result to serialize.
	 * @returns {string} JSON string.
	 */
	presentLintResult(result: IPrLintResult): string {
		return JSON.stringify(result, null, JSON_INDENT);
	},
};
