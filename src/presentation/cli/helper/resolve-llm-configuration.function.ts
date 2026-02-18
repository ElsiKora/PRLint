import type { ICliInterfaceService } from "../../../application/interface/cli-interface-service.interface";
import type { IConfigService } from "../../../application/interface/config-service.interface";
import type { ConfigureLlmUseCase } from "../../../application/use-case/configure-llm.use-case";
import type { ELlmProvider } from "../../../domain/enum/llm-provider.enum";
import type { IPrLintFullConfig } from "../../../domain/interface/prlint-config.interface";

import { LlmConfiguration } from "../../../domain/entity/llm-configuration.entity";
import { ApiKey } from "../../../domain/value-object/api-key.value-object";

/**
 * Resolves LLM configuration by reusing existing settings or prompting the user interactively.
 * @param {IConfigService} configService - Service for loading persisted configuration.
 * @param {ConfigureLlmUseCase} configureLlm - Use case for interactive LLM configuration.
 * @param {ICliInterfaceService} cliInterface - CLI interface for user prompts and output.
 * @returns {Promise<LlmConfiguration>} Resolved LLM configuration ready for use.
 */
export async function resolveLlmConfiguration(configService: IConfigService, configureLlm: ConfigureLlmUseCase, cliInterface: ICliInterfaceService): Promise<LlmConfiguration> {
	let llmConfig: LlmConfiguration | null = await configureLlm.getCurrentConfiguration();
	const isConfigExists: boolean = await configService.exists();

	if (isConfigExists) {
		const config: IPrLintFullConfig = await configService.get();
		const provider: ELlmProvider | undefined = config.generation.provider;
		const model: string | undefined = config.generation.model;

		let modeInfo: string;

		if (provider && model) {
			modeInfo = `${provider} provider, ${model} model`;
		} else if (provider) {
			modeInfo = `${provider} provider`;
		} else {
			modeInfo = "incomplete generation config";
		}

		const isUseExisting: boolean = await cliInterface.confirm(`Found existing configuration (${modeInfo}). Use it?`, true);

		if (!isUseExisting) {
			cliInterface.info("Let's reconfigure...");
			llmConfig = await configureLlm.configureInteractively();

			if (llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
				const { hint, prompt }: { hint: string; prompt: string } = configureLlm.getApiKeyPromptInfo(llmConfig.getProvider());

				const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string): string | undefined => {
					if (!value || value.trim().length === 0) {
						return "API key is required";
					}

					return undefined;
				});
				llmConfig = llmConfig.withApiKey(new ApiKey(credentialValue));
			}
		} else if (provider && !llmConfig) {
			const environmentVariableName: string = configureLlm.getEnvironmentVariableName(provider);
			cliInterface.warn(`API key not found in ${environmentVariableName} environment variable.`);

			const { hint, prompt }: { hint: string; prompt: string } = configureLlm.getApiKeyPromptInfo(provider);

			const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string): string | undefined => {
				if (!value || value.trim().length === 0) {
					return "API key is required";
				}

				return undefined;
			});
			llmConfig = new LlmConfiguration(provider, new ApiKey(credentialValue), model, config.generation.retries, config.generation.validationRetries);
		}
	} else {
		cliInterface.info("No configuration found. Let's set it up!");
		llmConfig = await configureLlm.configureInteractively();

		if (llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
			const { hint, prompt }: { hint: string; prompt: string } = configureLlm.getApiKeyPromptInfo(llmConfig.getProvider());

			const credentialValue: string = await cliInterface.text(prompt, hint, "", (value: string): string | undefined => {
				if (!value || value.trim().length === 0) {
					return "API key is required";
				}

				return undefined;
			});
			llmConfig = llmConfig.withApiKey(new ApiKey(credentialValue));
		}
	}

	if (!llmConfig) {
		throw new Error("Failed to configure LLM settings");
	}

	return llmConfig;
}
