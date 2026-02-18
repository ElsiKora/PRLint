import type { ILlmService } from "../../application/interface/llm-service.interface";
import type { IPrContext } from "../../domain/interface/pr-context.interface";

import OpenAI from "openai";

import { ELlmProvider } from "../../domain/enum/llm-provider.enum";

import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the OpenAI API. */
export class OpenAILlmService implements ILlmService {
	private readonly CLIENT: OpenAI;

	constructor(apiKey: string) {
		this.CLIENT = new OpenAI({ apiKey });
	}

	/**
	 * @param {IPrContext} context - PR context.
	 * @param {string} model - OpenAI model identifier.
	 * @returns {Promise<{ body: string; title: string }>} Generated title and body.
	 */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const response: OpenAI.Chat.Completions.ChatCompletion = await this.CLIENT.chat.completions.create({
			messages: [
				{ content: PR_GENERATION_SYSTEM_PROMPT, role: "system" as const },
				{ content: buildUserPrompt(context), role: "user" as const },
			],
			model,
		});

		const raw: string = response.choices[0]?.message?.content ?? "";

		return parseLlmResponse(raw);
	}

	/** @returns {ELlmProvider} The OpenAI provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.OPENAI;
	}
}
