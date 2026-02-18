import type { ILlmService } from "../../application/interface/llm-service.interface";
import type { IPrContext } from "../../domain/interface/pr-context.interface";

import { fetch } from "undici";

import { ELlmProvider } from "../../domain/enum/llm-provider.enum";

import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the local Ollama HTTP API. */
export class OllamaLlmService implements ILlmService {
	private readonly BASE_URL: string;

	constructor(baseUrl: string = "http://localhost:11434") {
		this.BASE_URL = baseUrl;
	}

	/**
	 * @param {IPrContext} context - PR context.
	 * @param {string} model - Ollama model name.
	 * @returns {Promise<{ body: string; title: string }>} Generated title and body.
	 */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const requestBody: Record<string, unknown> = {
			messages: [
				{ content: PR_GENERATION_SYSTEM_PROMPT, role: "system" },
				{ content: buildUserPrompt(context), role: "user" },
			],
			model,
			["stream"]: false,
		};

		const response: Awaited<ReturnType<typeof fetch>> = await fetch(`${this.BASE_URL}/api/chat`, {
			body: JSON.stringify(requestBody),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		});

		if (!response.ok) {
			throw new Error(`Ollama API returned ${String(response.status)}: ${await response.text()}`);
		}

		const data: { message: { content: string } } = (await response.json()) as { message: { content: string } };

		return parseLlmResponse(data.message.content);
	}

	/** @returns {ELlmProvider} The Ollama provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.OLLAMA;
	}
}
