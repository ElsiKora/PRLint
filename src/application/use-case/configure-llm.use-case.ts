import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES, MAX_RETRY_COUNT, MIN_RETRY_COUNT } from "../../domain/constant/numeric.constant";
import { LlmConfiguration } from "../../domain/entity/llm-configuration.entity";
import { EAnthropicModel } from "../../domain/enum/anthropic-model.enum";
import { EGoogleModel } from "../../domain/enum/google-model.enum";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import { EOllamaModel } from "../../domain/enum/ollama-model.enum";
import { EOpenAIModel } from "../../domain/enum/openai-model.enum";
import { ApiKey } from "../../domain/value-object/api-key.value-object";
import type { ICliInterfaceService } from "../interface/cli-interface-service.interface";
import type { IConfigService } from "../interface/config-service.interface";

const ENV_KEY_MAP: Record<ELlmProvider, string> = {
	[ELlmProvider.ANTHROPIC]: "ANTHROPIC_API_KEY",
	[ELlmProvider.GOOGLE]: "GOOGLE_API_KEY",
	[ELlmProvider.OLLAMA]: "OLLAMA_API_KEY",
	[ELlmProvider.OPENAI]: "OPENAI_API_KEY",
};

/** Orchestrates the interactive LLM configuration flow via CLI prompts. */
export class ConfigureLlmUseCase {
	private readonly CLI_INTERFACE: ICliInterfaceService;
	private readonly CONFIG_SERVICE: IConfigService;

	constructor(configService: IConfigService, cliInterface: ICliInterfaceService) {
		this.CLI_INTERFACE = cliInterface;
		this.CONFIG_SERVICE = configService;
	}

	/** Walks the user through provider, model, and retry configuration. @returns The assembled LlmConfiguration. */
	public async configureInteractively(): Promise<LlmConfiguration> {
		const provider = await this.CLI_INTERFACE.select<ELlmProvider>(
			"Select an LLM provider:",
			[
				{ label: "Anthropic", value: ELlmProvider.ANTHROPIC },
				{ label: "Google", value: ELlmProvider.GOOGLE },
				{ label: "Ollama", value: ELlmProvider.OLLAMA },
				{ label: "OpenAI", value: ELlmProvider.OPENAI },
			],
		);

		const model = await this.selectModelForProvider(provider);

		const envKey = ENV_KEY_MAP[provider];
		const envValue = process.env[envKey];
		let apiKey: ApiKey;

		if (envValue) {
			apiKey = new ApiKey(envValue);
			this.CLI_INTERFACE.info(`Using API key from environment variable ${envKey}.`);
		} else {
			apiKey = new ApiKey("will-prompt-on-use");
			this.CLI_INTERFACE.warn(`No ${envKey} found. You will be prompted for an API key when needed.`);
		}

		let maxRetries = DEFAULT_MAX_RETRIES;
		let validationMaxRetries = DEFAULT_VALIDATION_MAX_RETRIES;

		const configureAdvanced = await this.CLI_INTERFACE.confirm("Configure advanced settings?", false);

		if (configureAdvanced) {
			const retriesInput = await this.CLI_INTERFACE.text(
				"Max LLM call retries:",
				String(DEFAULT_MAX_RETRIES),
				String(DEFAULT_MAX_RETRIES),
				(value: string) => this.validateRetryCount(value),
			);
			maxRetries = Number(retriesInput);

			const validationRetriesInput = await this.CLI_INTERFACE.text(
				"Max validation retries:",
				String(DEFAULT_VALIDATION_MAX_RETRIES),
				String(DEFAULT_VALIDATION_MAX_RETRIES),
				(value: string) => this.validateRetryCount(value),
			);
			validationMaxRetries = Number(validationRetriesInput);
		}

		const configuration = new LlmConfiguration(provider, apiKey, model, maxRetries, validationMaxRetries);

		await this.saveConfiguration(configuration);

		this.CLI_INTERFACE.success("LLM configuration saved successfully.");

		return configuration;
	}

	/** Loads the current LLM configuration from disk and environment. @returns The current configuration, or null if not configured. */
	public async getCurrentConfiguration(): Promise<LlmConfiguration | null> {
		const config = await this.CONFIG_SERVICE.get();
		const provider = config.generation.provider;

		if (!provider) {
			return null;
		}

		const envKey = ENV_KEY_MAP[provider];
		const envValue = process.env[envKey];

		if (envValue) {
			return new LlmConfiguration(
				provider,
				new ApiKey(envValue),
				config.generation.model,
				config.generation.retries,
				config.generation.validationRetries,
			);
		}

		return new LlmConfiguration(
			provider,
			new ApiKey("will-prompt-on-use"),
			config.generation.model,
			config.generation.retries,
			config.generation.validationRetries,
		);
	}

	private async saveConfiguration(configuration: LlmConfiguration): Promise<void> {
		const current = await this.CONFIG_SERVICE.get();

		await this.CONFIG_SERVICE.save({
			...current,
			generation: {
				model: configuration.getModel() ?? current.generation.model ?? undefined,
				provider: configuration.getProvider(),
				retries: configuration.getMaxRetries(),
				validationRetries: configuration.getValidationMaxRetries(),
			},
		});
	}

	private async selectModelForProvider(provider: ELlmProvider): Promise<string> {
		switch (provider) {
			case ELlmProvider.ANTHROPIC: {
				return this.CLI_INTERFACE.select<string>(
					"Select an Anthropic model:",
					Object.values(EAnthropicModel).map((model) => ({ label: model, value: model })),
				);
			}

			case ELlmProvider.GOOGLE: {
				return this.CLI_INTERFACE.select<string>(
					"Select a Google model:",
					Object.values(EGoogleModel).map((model) => ({ label: model, value: model })),
				);
			}

			case ELlmProvider.OLLAMA: {
				return this.CLI_INTERFACE.select<string>(
					"Select an Ollama model:",
					Object.values(EOllamaModel).map((model) => ({ label: model, value: model })),
				);
			}

			case ELlmProvider.OPENAI: {
				return this.CLI_INTERFACE.select<string>(
					"Select an OpenAI model:",
					Object.values(EOpenAIModel).map((model) => ({ label: model, value: model })),
				);
			}

			default: {
				const _exhaustive: never = provider;

				throw new Error(`Unsupported provider: ${String(_exhaustive)}`);
			}
		}
	}

	private validateRetryCount(value: string): string | undefined {
		const num = Number(value);

		if (Number.isNaN(num) || !Number.isInteger(num)) {
			return "Please enter a valid integer.";
		}

		if (num < MIN_RETRY_COUNT || num > MAX_RETRY_COUNT) {
			return `Retry count must be between ${MIN_RETRY_COUNT} and ${MAX_RETRY_COUNT}.`;
		}

		return undefined;
	}
}
