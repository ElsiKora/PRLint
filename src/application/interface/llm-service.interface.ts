import type { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";

/** Abstraction for generating PR content via a large language model. */
export interface ILlmService {
	/** @param context - The PR context to generate from. @param model - The model identifier. @returns Generated title and body. */
	generate(context: IPrContext, model: string): Promise<{ body: string; title: string }>;

	/** @returns The LLM provider this service represents. */
	getProvider(): ELlmProvider;
}
