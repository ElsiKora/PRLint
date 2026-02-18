import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";

/** Formats domain results as JSON strings for machine consumption. */
export class JsonPresenter {
	/** @param context - PR context to serialize. @returns JSON string. */
	static presentContext(context: IPrContext): string {
		return JSON.stringify(context, null, 2);
	}

	/** @param result - Lint result to serialize. @returns JSON string. */
	static presentLintResult(result: IPrLintResult): string {
		return JSON.stringify(result, null, 2);
	}
}
