import type { ILlmService } from "../../application/interface/llm-service.interface";
import type { IPrContext } from "../../domain/interface/pr-context.interface";

import Anthropic from "@anthropic-ai/sdk";

import { MAX_TOKENS } from "../../domain/constant/numeric.constant";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";

import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the Anthropic API. */
export class AnthropicLlmService implements ILlmService {
	private readonly CLIENT: Anthropic;

	constructor(apiKey: string) {
		this.CLIENT = new Anthropic({ apiKey });
	}

	/**
	 * @param {IPrContext} context - PR context.
	 * @param {string} model - Anthropic model identifier.
	 * @returns {Promise<{ body: string; title: string }>} Generated title and body.
	 */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const response: Anthropic.Message = await this.CLIENT.messages.create({
			max_tokens: MAX_TOKENS,
			messages: [{ content: buildUserPrompt(context), role: "user" as const }],
			model,
			system: PR_GENERATION_SYSTEM_PROMPT,
		});

		const block: Anthropic.ContentBlock | undefined = response.content[0];
		const raw: string = block && "text" in block ? block.text : "";

		return parseLlmResponse(raw);
	}

	/** @returns {ELlmProvider} The Anthropic provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.ANTHROPIC;
	}
}
