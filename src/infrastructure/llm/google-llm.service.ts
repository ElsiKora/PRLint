import { GoogleGenerativeAI } from "@google/generative-ai";

import type { ILlmService } from "../../application/interface/llm-service.interface";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the Google Generative AI SDK. */
export class GoogleLlmService implements ILlmService {
	private readonly CLIENT: GoogleGenerativeAI;

	constructor(apiKey: string) {
		this.CLIENT = new GoogleGenerativeAI(apiKey);
	}

	/** @param context - PR context. @param model - Google model identifier. @returns Generated title and body. */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const genModel = this.CLIENT.getGenerativeModel({
			model,
			systemInstruction: PR_GENERATION_SYSTEM_PROMPT,
		});

		const result = await genModel.generateContent(buildUserPrompt(context));
		const raw = result.response.text();

		return parseLlmResponse(raw);
	}

	/** @returns The Google provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.GOOGLE;
	}
}
