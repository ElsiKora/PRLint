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

			let llmConfig: LlmConfiguration;
			const currentConfig = await configureLlm.getCurrentConfiguration();

			if (currentConfig) {
				const useExisting = await cliInterface.confirm(
					`Found existing configuration (${currentConfig.getProvider()}, ${currentConfig.getModel()}). Use it?`,
					true,
				);

				if (useExisting) {
					if (currentConfig.isConfigured()) {
						llmConfig = currentConfig;
					} else {
						const apiKey = await cliInterface.text(
							`Enter your ${currentConfig.getProvider()} API key`,
							"sk-...",
							undefined,
							(v: string) => (v.length > 0 ? undefined : "API key is required"),
						);
						llmConfig = currentConfig.withApiKey(new ApiKey(apiKey));
					}
				} else {
					llmConfig = await configureLlm.configureInteractively();
				}
			} else {
				cliInterface.info("No LLM configuration found. Let's set it up!");
				llmConfig = await configureLlm.configureInteractively();
			}

			if (llmConfig.getApiKey().getValue() === "will-prompt-on-use") {
				const apiKey = await cliInterface.text(
					`Enter your ${llmConfig.getProvider()} API key`,
					"sk-...",
					undefined,
					(v: string) => (v.length > 0 ? undefined : "API key is required"),
				);
				llmConfig = llmConfig.withApiKey(new ApiKey(apiKey));
			}

			const llmServices = this.CONTAINER.get<Array<ILlmService>>(LlmServicesToken) ?? [];
			const existingService = llmServices.find((s) => s.getProvider() === llmConfig.getProvider());
			const llmService = existingService ?? resolveLlmService(llmConfig);

			if (spinner) {
				spinner.start();
				spinner.text = "Collecting context...";
			}

			const config = await configService.get();
			const model = llmConfig.getModel() ?? "";
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
