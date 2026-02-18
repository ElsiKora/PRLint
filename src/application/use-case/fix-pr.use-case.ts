import type { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintIssue } from "../../domain/interface/pr-lint-issue.interface";
import type { ILlmService } from "../interface/llm-service.interface";

/** Re-generates PR content with lint issue feedback so the LLM can correct violations. */
export class FixPrUseCase {
	private readonly LLM_SERVICES: Array<ILlmService>;

	constructor(llmServices: Array<ILlmService>) {
		this.LLM_SERVICES = llmServices;
	}

	/**
	 * @param {IPrContext} context - Current PR context including the failing title/body.
	 * @param {ELlmProvider} provider - LLM provider to use.
	 * @param {string} model - Model identifier.
	 * @param {Array<IPrLintIssue>} issues - Lint issues that must be resolved.
	 * @returns {Promise<{body: string; title: string}>} Fixed PR title and body.
	 */
	async execute(context: IPrContext, provider: ELlmProvider, model: string, issues: Array<IPrLintIssue>): Promise<{ body: string; title: string }> {
		const service: ILlmService | undefined = this.LLM_SERVICES.find((s: ILlmService) => s.getProvider() === provider);

		if (!service) {
			throw new Error(`No LLM service registered for provider: ${provider}`);
		}

		const issueBlock: string = issues.map((issue: IPrLintIssue) => `- [${issue.code}] ${issue.details}`).join("\n");

		const fixContext: IPrContext = {
			...context,
			body: `${context.body}\n\n## Lint Issues to Fix\n${issueBlock}`,
		};

		return service.generate(fixContext, model);
	}
}
