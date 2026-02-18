import type { ELlmProvider } from "../enum/llm-provider.enum";
import type { ApiKey } from "../value-object/api-key.value-object";

import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../constant/numeric.constant";

/** Immutable entity representing the full LLM configuration for PR generation. */
export class LlmConfiguration {
	private readonly API_KEY: ApiKey;

	private readonly MAX_RETRIES: number;

	private readonly MODEL: string | undefined;

	private readonly PROVIDER: ELlmProvider;

	private readonly VALIDATION_MAX_RETRIES: number;

	constructor(provider: ELlmProvider, apiKey: ApiKey, model?: string, maxRetries: number = DEFAULT_MAX_RETRIES, validationMaxRetries: number = DEFAULT_VALIDATION_MAX_RETRIES) {
		this.API_KEY = apiKey;
		this.MAX_RETRIES = maxRetries;
		this.MODEL = model;
		this.PROVIDER = provider;
		this.VALIDATION_MAX_RETRIES = validationMaxRetries;
	}

	/** @returns {ApiKey} The configured API key value object. */
	public getApiKey(): ApiKey {
		return this.API_KEY;
	}

	/** @returns {number} The maximum number of LLM call retries. */
	public getMaxRetries(): number {
		return this.MAX_RETRIES;
	}

	/** @returns {string | undefined} The selected model identifier, if any. */
	public getModel(): string | undefined {
		return this.MODEL;
	}

	/** @returns {ELlmProvider} The selected LLM provider. */
	public getProvider(): ELlmProvider {
		return this.PROVIDER;
	}

	/** @returns {number} The maximum number of validation retries. */
	public getValidationMaxRetries(): number {
		return this.VALIDATION_MAX_RETRIES;
	}

	/** @returns {boolean} Whether the configuration has a valid API key. */
	public isConfigured(): boolean {
		return this.API_KEY.isValid();
	}

	/**
	 * @param {ApiKey} apiKey - The API key to set.
	 * @returns {LlmConfiguration} A new LlmConfiguration with the given API key, preserving all other fields.
	 */
	public withApiKey(apiKey: ApiKey): LlmConfiguration {
		return new LlmConfiguration(this.PROVIDER, apiKey, this.MODEL, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}

	/**
	 * @param {string} model - The model identifier to set.
	 * @returns {LlmConfiguration} A new LlmConfiguration with the given model, preserving all other fields.
	 */
	public withModel(model: string): LlmConfiguration {
		return new LlmConfiguration(this.PROVIDER, this.API_KEY, model, this.MAX_RETRIES, this.VALIDATION_MAX_RETRIES);
	}
}
