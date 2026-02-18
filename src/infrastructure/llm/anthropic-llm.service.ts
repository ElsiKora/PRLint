import Anthropic from "@anthropic-ai/sdk";

import type { ILlmService } from "../../application/interface/llm-service.interface";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the Anthropic API. */
export class AnthropicLlmService implements ILlmService {
	private readonly CLIENT: Anthropic;

	constructor(apiKey: string) {
		this.CLIENT = new Anthropic({ apiKey });
	}

	/** @param context - PR context. @param model - Anthropic model identifier. @returns Generated title and body. */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const response = await this.CLIENT.messages.create({
			max_tokens: 4096,
			messages: [{ content: buildUserPrompt(context), role: "user" as const }],
			model,
			system: PR_GENERATION_SYSTEM_PROMPT,
		});

		const block = response.content[0];
		const raw = block && "text" in block ? block.text : "";

		return parseLlmResponse(raw);
	}

	/** @returns The Anthropic provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.ANTHROPIC;
	}
}
