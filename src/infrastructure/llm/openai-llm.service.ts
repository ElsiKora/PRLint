import OpenAI from "openai";

import type { ILlmService } from "../../application/interface/llm-service.interface";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the OpenAI API. */
export class OpenAILlmService implements ILlmService {
	private readonly CLIENT: OpenAI;

	constructor(apiKey: string) {
		this.CLIENT = new OpenAI({ apiKey });
	}

	/** @param context - PR context. @param model - OpenAI model identifier. @returns Generated title and body. */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const response = await this.CLIENT.chat.completions.create({
			messages: [
				{ content: PR_GENERATION_SYSTEM_PROMPT, role: "system" as const },
				{ content: buildUserPrompt(context), role: "user" as const },
			],
			model,
		});

		const raw = response.choices[0]?.message?.content ?? "";

		return parseLlmResponse(raw);
	}

	/** @returns The OpenAI provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.OPENAI;
	}
}
