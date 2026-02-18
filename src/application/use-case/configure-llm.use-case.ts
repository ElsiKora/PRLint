import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES, MAX_RETRY_COUNT, MIN_RETRY_COUNT } from "../../domain/constant/numeric.constant";
import { LlmConfiguration } from "../../domain/entity/llm-configuration.entity";
import { EAnthropicModel } from "../../domain/enum/anthropic-model.enum";
import { EGoogleModel } from "../../domain/enum/google-model.enum";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import { EOllamaModel } from "../../domain/enum/ollama-model.enum";
import { EOpenAIModel } from "../../domain/enum/openai-model.enum";
import { ApiKey } from "../../domain/value-object/api-key.value-object";
import type { ICliInterfaceService } from "../interface/cli-interface-service.interface";
import type { ICliInterfaceServiceSelectOptions } from "../interface/cli-interface-service-select-options.interface";
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
		this.CLI_INTERFACE.info("Setting up PR generation with LLM...");

		const provider = await this.CLI_INTERFACE.select<ELlmProvider>(
			"Select your LLM provider:",
			[
				{ label: "OpenAI (GPT-5, GPT-4o)", value: ELlmProvider.OPENAI },
				{ label: "Anthropic (Claude)", value: ELlmProvider.ANTHROPIC },
				{ label: "Google (Gemini)", value: ELlmProvider.GOOGLE },
				{ label: "Ollama (Local)", value: ELlmProvider.OLLAMA },
			],
		);

		const model = await this.selectModelForProvider(provider);

		const environmentVariableName = ENV_KEY_MAP[provider];
		const environmentApiKey = process.env[environmentVariableName];
		let credentialValue: string;

		if (environmentApiKey && environmentApiKey.trim().length > 0) {
			this.CLI_INTERFACE.success(`Found API key in environment variable: ${environmentVariableName}`);
			credentialValue = environmentApiKey;
		} else {
			let keyFormatInfo = "";

			switch (provider) {
				case ELlmProvider.ANTHROPIC:
				case ELlmProvider.GOOGLE:
				case ELlmProvider.OPENAI: {
					break;
				}

				case ELlmProvider.OLLAMA: {
					keyFormatInfo = " (format: host:port or host:port|custom-model)";
					break;
				}

				default: {
					const exhaustiveCheck: never = provider;
					throw new Error(`Unsupported provider: ${String(exhaustiveCheck)}`);
				}
			}

			this.CLI_INTERFACE.info(`API key will be read from ${environmentVariableName} environment variable${keyFormatInfo} or prompted each time.`);
			credentialValue = "will-prompt-on-use";
		}

		let maxRetries = DEFAULT_MAX_RETRIES;
		let validationMaxRetries = DEFAULT_VALIDATION_MAX_RETRIES;

		const configureAdvanced = await this.CLI_INTERFACE.confirm("Would you like to configure advanced settings (retry counts)?", false);

		if (configureAdvanced) {
			const retriesInput = await this.CLI_INTERFACE.text(
				"Max retries for AI generation (default: 3):",
				String(DEFAULT_MAX_RETRIES),
				String(DEFAULT_MAX_RETRIES),
				(value: string) => this.validateRetryCount(value),
			);
			maxRetries = Number(retriesInput);

			const validationRetriesInput = await this.CLI_INTERFACE.text(
				"Max retries for validation fixes (default: 3):",
				String(DEFAULT_VALIDATION_MAX_RETRIES),
				String(DEFAULT_VALIDATION_MAX_RETRIES),
				(value: string) => this.validateRetryCount(value),
			);
			validationMaxRetries = Number(validationRetriesInput);
		}

		const configuration = new LlmConfiguration(provider, new ApiKey(credentialValue), model, maxRetries, validationMaxRetries);

		await this.saveConfiguration(configuration);

		this.CLI_INTERFACE.success("Configuration saved successfully!");

		return configuration;
	}

	/** Loads the current LLM configuration from disk and environment. @returns The current configuration, or null if not configured. */
	public async getCurrentConfiguration(): Promise<LlmConfiguration | null> {
		const config = await this.CONFIG_SERVICE.get();
		const provider = config.generation.provider;

		if (!provider) {
			return null;
		}

		const environmentVariableName = ENV_KEY_MAP[provider];
		const environmentApiKey = process.env[environmentVariableName];

		if (!environmentApiKey || environmentApiKey.trim().length === 0) {
			return null;
		}

		return new LlmConfiguration(
			provider,
			new ApiKey(environmentApiKey),
			config.generation.model,
			config.generation.retries,
			config.generation.validationRetries,
		);
	}

	public getApiKeyPromptInfo(provider: ELlmProvider): { hint: string; prompt: string } {
		switch (provider) {
			case ELlmProvider.ANTHROPIC: {
				return { hint: "sk-ant-...", prompt: "Enter your Anthropic API key for this session:" };
			}

			case ELlmProvider.GOOGLE: {
				return { hint: "AIza...", prompt: "Enter your Google AI API key for this session:" };
			}

			case ELlmProvider.OLLAMA: {
				return { hint: "host:11434 or host:11434|custom-model", prompt: "Enter your Ollama endpoint for this session:" };
			}

			case ELlmProvider.OPENAI: {
				return { hint: "sk-...", prompt: "Enter your OpenAI API key for this session:" };
			}

			default: {
				return { hint: "API key", prompt: `Enter your ${provider} API key:` };
			}
		}
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
				const options: Array<ICliInterfaceServiceSelectOptions> = [
					{ label: "Claude Opus 4.5 (Latest, most capable)", value: EAnthropicModel.CLAUDE_OPUS_4_5 },
					{ label: "Claude Sonnet 4.5 (Latest, balanced)", value: EAnthropicModel.CLAUDE_SONNET_4_5 },
					{ label: "Claude Haiku 4.5 (Latest, fastest)", value: EAnthropicModel.CLAUDE_HAIKU_4_5 },
					{ label: "Claude Opus 4", value: EAnthropicModel.CLAUDE_OPUS_4 },
					{ label: "Claude Sonnet 4", value: EAnthropicModel.CLAUDE_SONNET_4 },
					{ label: "Claude 3.7 Sonnet (Extended thinking)", value: EAnthropicModel.CLAUDE_3_7_SONNET },
					{ label: "Claude 3.5 Sonnet", value: EAnthropicModel.CLAUDE_3_5_SONNET },
					{ label: "Claude 3.5 Haiku (Fast)", value: EAnthropicModel.CLAUDE_3_5_HAIKU },
				];

				return this.CLI_INTERFACE.select<string>("Select Anthropic model:", options, EAnthropicModel.CLAUDE_SONNET_4_5);
			}

			case ELlmProvider.GOOGLE: {
				const options: Array<ICliInterfaceServiceSelectOptions> = [
					{ label: "Gemini 3 Pro Preview (Latest)", value: EGoogleModel.GEMINI_3_PRO_PREVIEW },
					{ label: "Gemini 2.5 Pro (Most capable)", value: EGoogleModel.GEMINI_2_5_PRO },
					{ label: "Gemini 2.5 Flash (Fast)", value: EGoogleModel.GEMINI_2_5_FLASH },
					{ label: "Gemini 2.5 Flash Lite (Lightweight)", value: EGoogleModel.GEMINI_2_5_FLASH_LITE },
					{ label: "Gemini 2.0 Flash", value: EGoogleModel.GEMINI_2_0_FLASH },
					{ label: "Gemini 2.0 Flash Lite", value: EGoogleModel.GEMINI_2_0_FLASH_LITE },
					{ label: "Gemini 1.5 Pro (Stable)", value: EGoogleModel.GEMINI_1_5_PRO },
					{ label: "Gemini 1.5 Flash (Fast, stable)", value: EGoogleModel.GEMINI_1_5_FLASH },
				];

				return this.CLI_INTERFACE.select<string>("Select Google model:", options, EGoogleModel.GEMINI_2_5_FLASH);
			}

			case ELlmProvider.OLLAMA: {
				const options: Array<ICliInterfaceServiceSelectOptions> = [
					{ label: "Llama 4 (Latest)", value: EOllamaModel.LLAMA4 },
					{ label: "Llama 3.3", value: EOllamaModel.LLAMA3_3 },
					{ label: "Llama 3.2", value: EOllamaModel.LLAMA3_2 },
					{ label: "Llama 3.1", value: EOllamaModel.LLAMA3_1 },
					{ label: "Qwen 3 (Latest Alibaba)", value: EOllamaModel.QWEN3 },
					{ label: "Qwen 3 Coder (Code-focused)", value: EOllamaModel.QWEN3_CODER },
					{ label: "Phi 4 (Microsoft)", value: EOllamaModel.PHI4 },
					{ label: "Gemma 3 (Google)", value: EOllamaModel.GEMMA3 },
					{ label: "Mixtral (Mistral)", value: EOllamaModel.MIXTRAL },
					{ label: "CodeLlama", value: EOllamaModel.CODELLAMA },
					{ label: "Custom Model", value: EOllamaModel.CUSTOM },
				];

				return this.CLI_INTERFACE.select<string>("Select Ollama model:", options, EOllamaModel.LLAMA3_3);
			}

			case ELlmProvider.OPENAI: {
				const options: Array<ICliInterfaceServiceSelectOptions> = [
					{ label: "GPT-5.2 (Latest, most capable)", value: EOpenAIModel.GPT_5_2 },
					{ label: "GPT-5.2 Pro (Enhanced performance)", value: EOpenAIModel.GPT_5_2_PRO },
					{ label: "GPT-5.1", value: EOpenAIModel.GPT_5_1 },
					{ label: "GPT-5", value: EOpenAIModel.GPT_5 },
					{ label: "GPT-5 Mini (Fast)", value: EOpenAIModel.GPT_5_MINI },
					{ label: "GPT-5 Nano (Fastest)", value: EOpenAIModel.GPT_5_NANO },
					{ label: "GPT-4o", value: EOpenAIModel.GPT_4O },
					{ label: "GPT-4o Mini (Faster, cheaper)", value: EOpenAIModel.GPT_4O_MINI },
					{ label: "O3 (Enhanced reasoning)", value: EOpenAIModel.O3 },
					{ label: "O4 Mini (Fast reasoning)", value: EOpenAIModel.O4_MINI },
					{ label: "GPT-3.5 Turbo (Legacy)", value: EOpenAIModel.GPT_35_TURBO },
				];

				return this.CLI_INTERFACE.select<string>("Select OpenAI model:", options, EOpenAIModel.GPT_5_2);
			}

			default: {
				const _exhaustive: never = provider;

				throw new Error(`Unsupported provider: ${String(_exhaustive)}`);
			}
		}
	}

	private validateRetryCount(value: string): string | undefined {
		const num = Number.parseInt(value, 10);

		if (Number.isNaN(num) || num < MIN_RETRY_COUNT || num > MAX_RETRY_COUNT) {
			return "Please enter a number between 1 and 10";
		}

		return undefined;
	}
}
