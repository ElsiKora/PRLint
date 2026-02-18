import type { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { ILlmService } from "../interface/llm-service.interface";

/** Generates a PR title and body using the configured LLM provider. */
export class GeneratePrUseCase {
	constructor(private readonly LLM_SERVICES: Array<ILlmService>) {}

	/** @param context - PR context to generate from. @param provider - Which LLM provider to use. @param model - The model identifier. @returns Generated PR title and body. */
	async execute(context: IPrContext, provider: ELlmProvider, model: string): Promise<{ body: string; title: string }> {
		const service = this.LLM_SERVICES.find((s) => s.getProvider() === provider);

		if (!service) {
			throw new Error(`No LLM service registered for provider: ${provider}`);
		}

		return service.generate(context, model);
	}
}
