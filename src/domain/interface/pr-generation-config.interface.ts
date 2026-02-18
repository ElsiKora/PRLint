import type { ELlmProvider } from "../enum/llm-provider.enum";

export interface IPrGenerationConfig {
	model?: string;
	provider?: ELlmProvider;
	retries: number;
	validationRetries: number;
}
