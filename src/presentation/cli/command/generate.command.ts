import type { IContainer } from "@elsikora/cladi";
import type { Ora } from "ora";

import type { ICliInterfaceService } from "../../../application/interface/cli-interface-service.interface";
import type { IConfigService } from "../../../application/interface/config-service.interface";
import type { ILlmService } from "../../../application/interface/llm-service.interface";
import type { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import type { ConfigureLlmUseCase } from "../../../application/use-case/configure-llm.use-case";
import type { LintPrUseCase } from "../../../application/use-case/lint-pr.use-case";
import type { LlmConfiguration } from "../../../domain/entity/llm-configuration.entity";
import type { IPrContext } from "../../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../../domain/interface/pr-lint-result.interface";
import type { IPrLintFullConfig } from "../../../domain/interface/prlint-config.interface";

import chalk from "chalk";
import ora from "ora";

import { JSON_INDENT, SEPARATOR_WIDTH } from "../../../domain/constant/numeric.constant";
import { ELlmProvider } from "../../../domain/enum/llm-provider.enum";
import { CliInterfaceServiceToken, CollectContextUseCaseToken, ConfigServiceToken, ConfigureLlmUseCaseToken, LintPrUseCaseToken, LlmServicesToken } from "../../../infrastructure/di/token.constant";
import { AnthropicLlmService } from "../../../infrastructure/llm/anthropic-llm.service";
import { GoogleLlmService } from "../../../infrastructure/llm/google-llm.service";
import { OllamaLlmService } from "../../../infrastructure/llm/ollama-llm.service";
import { OpenAILlmService } from "../../../infrastructure/llm/openai-llm.service";
import { HumanPresenter } from "../../presenter/human.presenter";
import { resolveLlmConfiguration } from "../helper/resolve-llm-configuration.function";

/** CLI command that generates a PR title and body, then lints it. */
export class GenerateCommand {
	private readonly CONTAINER: IContainer;

	constructor(container: IContainer) {
		this.CONTAINER = container;
	}

	/**
	 * @param {object} options - Command options.
	 * @param {boolean} options.isJson - Whether to output as JSON.
	 */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner: Ora | undefined = options.isJson ? undefined : ora("Generating PR content...").start();

		try {
			const configService: IConfigService | undefined = this.CONTAINER.get<IConfigService>(ConfigServiceToken);

			if (!configService) {
				throw new Error("ConfigService not registered in container");
			}

			const collectContext: CollectContextUseCase | undefined = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken);

			if (!collectContext) {
				throw new Error("CollectContextUseCase not registered in container");
			}

			const lintPr: LintPrUseCase | undefined = this.CONTAINER.get<LintPrUseCase>(LintPrUseCaseToken);

			if (!lintPr) {
				throw new Error("LintPrUseCase not registered in container");
			}

			const configureLlm: ConfigureLlmUseCase | undefined = this.CONTAINER.get<ConfigureLlmUseCase>(ConfigureLlmUseCaseToken);

			if (!configureLlm) {
				throw new Error("ConfigureLlmUseCase not registered in container");
			}

			const cliInterface: ICliInterfaceService | undefined = this.CONTAINER.get<ICliInterfaceService>(CliInterfaceServiceToken);

			if (!cliInterface) {
				throw new Error("CliInterfaceService not registered in container");
			}

			spinner?.stop();

			const llmConfig: LlmConfiguration = await resolveLlmConfiguration(configService, configureLlm, cliInterface);

			const model: string | undefined = llmConfig.getModel();

			if (!model) {
				throw new Error("No model configured. Re-run setup and select an LLM model.");
			}

			const llmServices: Array<ILlmService> = this.CONTAINER.get<Array<ILlmService>>(LlmServicesToken) ?? [];
			const existingService: ILlmService | undefined = llmServices.find((s: ILlmService) => s.getProvider() === llmConfig.getProvider());
			const llmService: ILlmService = existingService ?? resolveLlmService(llmConfig);

			if (spinner) {
				spinner.start();
				spinner.text = "Collecting context...";
			}

			const config: IPrLintFullConfig = await configService.get();
			const context: IPrContext = await collectContext.execute(config.github.base);

			if (spinner) spinner.text = "Calling LLM...";
			const generated: { body: string; title: string } = await llmService.generate(context, model);

			if (spinner) spinner.text = "Validating output...";
			const lintContext: IPrContext = { ...context, body: generated.body, title: generated.title };
			const result: IPrLintResult = lintPr.execute(lintContext, config.lint, config.ticket);

			spinner?.stop();

			if (options.isJson) {
				cliInterface.log(JSON.stringify({ lint: result, ...generated }, null, JSON_INDENT));
			} else {
				cliInterface.log(chalk.bold.cyan("Generated PR"));
				cliInterface.log(chalk.gray("─".repeat(SEPARATOR_WIDTH)));
				cliInterface.log(`${chalk.bold("Title:")} ${generated.title}\n`);
				cliInterface.log(generated.body);
				cliInterface.log("");
				cliInterface.log(HumanPresenter.presentLintResult(result));
			}

			if (!result.isPassed) {
				process.exitCode = 1;
			}
		} catch (error) {
			const message: string = error instanceof Error ? error.message : String(error);
			spinner?.fail(message);
			process.exitCode = 1;
		}
	}
}

/**
 * Resolves the appropriate LLM service implementation based on the configured provider.
 * @param {LlmConfiguration} config - LLM configuration containing provider and API key.
 * @returns {ILlmService} The instantiated LLM service for the configured provider.
 */
function resolveLlmService(config: LlmConfiguration): ILlmService {
	const key: string = config.getApiKey().getValue();

	switch (config.getProvider()) {
		case ELlmProvider.ANTHROPIC: {
			return new AnthropicLlmService(key);
		}

		case ELlmProvider.GOOGLE: {
			return new GoogleLlmService(key);
		}

		case ELlmProvider.OLLAMA: {
			return new OllamaLlmService(key);
		}

		case ELlmProvider.OPENAI: {
			return new OpenAILlmService(key);
		}
	}
}
