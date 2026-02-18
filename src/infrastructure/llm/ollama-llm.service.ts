import type { ILlmService } from "../../application/interface/llm-service.interface";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import type { IPrContext } from "../../domain/interface/pr-context.interface";
import { buildUserPrompt } from "./build-user-prompt.function";
import { parseLlmResponse } from "./parse-llm-response.function";
import { PR_GENERATION_SYSTEM_PROMPT } from "./pr-generation-prompt.constant";

/** LLM service implementation using the local Ollama HTTP API. */
export class OllamaLlmService implements ILlmService {
	private readonly BASE_URL: string;

	constructor(baseUrl: string = "http://localhost:11434") {
		this.BASE_URL = baseUrl;
	}

	/** @param context - PR context. @param model - Ollama model name. @returns Generated title and body. */
	async generate(context: IPrContext, model: string): Promise<{ body: string; title: string }> {
		const response = await fetch(`${this.BASE_URL}/api/chat`, {
			body: JSON.stringify({
				messages: [
					{ content: PR_GENERATION_SYSTEM_PROMPT, role: "system" },
					{ content: buildUserPrompt(context), role: "user" },
				],
				model,
				stream: false,
			}),
			headers: { "Content-Type": "application/json" },
			method: "POST",
		});

		if (!response.ok) {
			throw new Error(`Ollama API returned ${String(response.status)}: ${await response.text()}`);
		}

		const data = (await response.json()) as { message: { content: string } };

		return parseLlmResponse(data.message.content);
	}

	/** @returns The Ollama provider enum value. */
	getProvider(): ELlmProvider {
		return ELlmProvider.OLLAMA;
	}
}
