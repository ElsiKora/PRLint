import type { IContainer } from "@elsikora/cladi";
import chalk from "chalk";
import ora from "ora";

import type { ICliInterfaceService } from "../../../application/interface/cli-interface-service.interface";
import type { IConfigService } from "../../../application/interface/config-service.interface";
import type { IGitRepoService } from "../../../application/interface/git-repo.interface";
import type { ILlmService } from "../../../application/interface/llm-service.interface";
import { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import { ConfigureLlmUseCase } from "../../../application/use-case/configure-llm.use-case";
import { CreateOrUpdatePrUseCase } from "../../../application/use-case/create-or-update-pr.use-case";
import { LlmConfiguration } from "../../../domain/entity/llm-configuration.entity";
import { ELlmProvider } from "../../../domain/enum/llm-provider.enum";
import { ApiKey } from "../../../domain/value-object/api-key.value-object";
import { CliInterfaceServiceToken, CollectContextUseCaseToken, ConfigServiceToken, ConfigureLlmUseCaseToken, CreateOrUpdatePrUseCaseToken, GitRepoServiceToken, LlmServicesToken } from "../../../infrastructure/di/token.constant";
import { AnthropicLlmService } from "../../../infrastructure/llm/anthropic-llm.service";
import { GoogleLlmService } from "../../../infrastructure/llm/google-llm.service";
import { OllamaLlmService } from "../../../infrastructure/llm/ollama-llm.service";
import { OpenAILlmService } from "../../../infrastructure/llm/openai-llm.service";

const ENVIRONMENT_VARIABLE_NAMES: Record<ELlmProvider, string> = {
	[ELlmProvider.ANTHROPIC]: "ANTHROPIC_API_KEY",
	[ELlmProvider.GOOGLE]: "GOOGLE_API_KEY",
	[ELlmProvider.OLLAMA]: "OLLAMA_API_KEY",
	[ELlmProvider.OPENAI]: "OPENAI_API_KEY",
};

function resolveLlmService(config: LlmConfiguration): ILlmService {
	const key = config.getApiKey().getValue();

	switch (config.getProvider()) {
		case ELlmProvider.ANTHROPIC: return new AnthropicLlmService(key);
		case ELlmProvider.GOOGLE: return new GoogleLlmService(key);
		case ELlmProvider.OLLAMA: return new OllamaLlmService(key);
		case ELlmProvider.OPENAI: return new OpenAILlmService(key);
	}
}

/** CLI command that generates PR content and creates or updates a GitHub PR (idempotent). */
export class CreateCommand {
	constructor(private readonly CONTAINER: IContainer) {}

	/** @param options - Command options. */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner = options.isJson ? undefined : ora("Preparing PR...").start();

		try {
			const configService = this.CONTAINER.get<IConfigService>(ConfigServiceToken)!;
			const collectContext = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken)!;
			const createOrUpdatePr = this.CONTAINER.get<CreateOrUpdatePrUseCase>(CreateOrUpdatePrUseCaseToken)!;
			const gitRepoService = this.CONTAINER.get<IGitRepoService>(GitRepoServiceToken)!;
			const configureLlm = this.CONTAINER.get<ConfigureLlmUseCase>(ConfigureLlmUseCaseToken)!;
			const cliInterface = this.CONTAINER.get<ICliInterfaceService>(CliInterfaceServiceToken)!;

			spinner?.stop();

			let llmConfig: LlmConfiguration | null = await configureLlm.getCurrentConfiguration();
			const isConfigExists = await configService.exists();

			if (isConfigExists) {
				const config = await configService.get();
				const provider = config.generation.provider;
				const model = config.generation.model;
				const modeInfo =
					provider && model
						? `${provider} provider, ${model} model`
						: provider
							? `${provider} provider`
							: "incomplete generation config";
				const isUseExisting = await cliInterface.confirm(`Found existing configuration (${modeInfo}). Use it?`, true);

				if (!isUseExisting) {
					cliInterface.info("Let's reconfigure...");
					llmConfig = await configureLlm.configureInteractively();

					if (llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
						const { hint, prompt } = configureLlm.getApiKeyPromptInfo(llmConfig.getProvider());
						const credentialValue = await cliInterface.text(prompt, hint, "", (value: string) => {
							if (!value || value.trim().length === 0) {
								return "API key is required";
							}

							return;
						});
						llmConfig = llmConfig.withApiKey(new ApiKey(credentialValue));
					}
				} else if (provider && !llmConfig) {
					const environmentVariableName = ENVIRONMENT_VARIABLE_NAMES[provider];
					cliInterface.warn(`API key not found in ${environmentVariableName} environment variable.`);

					const { hint, prompt } = configureLlm.getApiKeyPromptInfo(provider);
					const credentialValue = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}

						return;
					});
					llmConfig = new LlmConfiguration(
						provider,
						new ApiKey(credentialValue),
						model,
						config.generation.retries,
						config.generation.validationRetries,
					);
				}
			} else {
				cliInterface.info("No configuration found. Let's set it up!");
				llmConfig = await configureLlm.configureInteractively();

				if (llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
					const { hint, prompt } = configureLlm.getApiKeyPromptInfo(llmConfig.getProvider());
					const credentialValue = await cliInterface.text(prompt, hint, "", (value: string) => {
						if (!value || value.trim().length === 0) {
							return "API key is required";
						}

						return;
					});
					llmConfig = llmConfig.withApiKey(new ApiKey(credentialValue));
				}
			}

			if (!llmConfig) {
				throw new Error("Failed to configure LLM settings");
			}

			const model = llmConfig.getModel();

			if (!model) {
				throw new Error("No model configured. Re-run setup and select an LLM model.");
			}

			const llmServices = this.CONTAINER.get<Array<ILlmService>>(LlmServicesToken) ?? [];
			const existingService = llmServices.find((s) => s.getProvider() === llmConfig.getProvider());
			const llmService = existingService ?? resolveLlmService(llmConfig);

			if (spinner) {
				spinner.start();
				spinner.text = "Collecting context...";
			}

			const config = await configService.get();
			const context = await collectContext.execute(config.github.base);

			if (spinner) spinner.text = "Generating PR content...";
			const generated = await llmService.generate(context, model);

			if (spinner) spinner.text = "Creating/updating PR...";
			const branch = await gitRepoService.getBranchName();

			if (config.github.prohibitedBranches.includes(branch)) {
				spinner?.fail(`Cannot create PR from prohibited branch "${branch}". Switch to a feature branch.`);
				process.exitCode = 1;

				return;
			}

			if (branch === config.github.base) {
				spinner?.fail(`Current branch "${branch}" is the same as target base. Switch to a feature branch.`);
				process.exitCode = 1;

				return;
			}

			const prNumber = await createOrUpdatePr.execute(generated.title, generated.body, branch, config.github.base, config.github.draft);

			spinner?.succeed(`PR #${String(prNumber)} ready`);

			if (options.isJson) {
				console.log(JSON.stringify({ body: generated.body, prNumber, title: generated.title }, null, 2));
			} else {
				console.log(`${chalk.bold("Title:")} ${generated.title}`);
				console.log(`${chalk.bold("PR:")}    #${String(prNumber)}`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			spinner?.fail(message);
			process.exitCode = 1;
		}
	}
}
