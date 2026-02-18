import type { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintIssue } from "../../domain/interface/pr-lint-issue.interface";
import type { ILlmService } from "../interface/llm-service.interface";

/** Re-generates PR content with lint issue feedback so the LLM can correct violations. */
export class FixPrUseCase {
	constructor(private readonly LLM_SERVICES: Array<ILlmService>) {}

	/** @param context - Current PR context including the failing title/body. @param provider - LLM provider to use. @param model - Model identifier. @param issues - Lint issues that must be resolved. @returns Fixed PR title and body. */
	async execute(context: IPrContext, provider: ELlmProvider, model: string, issues: Array<IPrLintIssue>): Promise<{ body: string; title: string }> {
		const service = this.LLM_SERVICES.find((s) => s.getProvider() === provider);

		if (!service) {
			throw new Error(`No LLM service registered for provider: ${provider}`);
		}

		const issueBlock = issues.map((i) => `- [${i.code}] ${i.details}`).join("\n");

		const fixContext: IPrContext = {
			...context,
			body: `${context.body}\n\n## Lint Issues to Fix\n${issueBlock}`,
		};

		return service.generate(fixContext, model);
	}
}
