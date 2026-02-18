import type { IContainer } from "@elsikora/cladi";
import chalk from "chalk";
import ora from "ora";

import type { IConfigService } from "../../../application/interface/config-service.interface";
import { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import { FixPrUseCase } from "../../../application/use-case/fix-pr.use-case";
import { GeneratePrUseCase } from "../../../application/use-case/generate-pr.use-case";
import { LintPrUseCase } from "../../../application/use-case/lint-pr.use-case";
import { CollectContextUseCaseToken, ConfigServiceToken, FixPrUseCaseToken, GeneratePrUseCaseToken, LintPrUseCaseToken } from "../../../infrastructure/di/token.constant";
import { HumanPresenter } from "../../presenter/human.presenter";

/** CLI command that generates, lints, and iteratively fixes PR content until it passes. */
export class FixCommand {
	constructor(private readonly CONTAINER: IContainer) {}

	/** @param options - Command options. */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner = options.isJson ? undefined : ora("Generating PR content...").start();

		try {
			const configService = this.CONTAINER.get<IConfigService>(ConfigServiceToken)!;
			const collectContext = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken)!;
			const generatePr = this.CONTAINER.get<GeneratePrUseCase>(GeneratePrUseCaseToken)!;
			const fixPr = this.CONTAINER.get<FixPrUseCase>(FixPrUseCaseToken)!;
			const lintPr = this.CONTAINER.get<LintPrUseCase>(LintPrUseCaseToken)!;

			const config = await configService.get();
			const context = await collectContext.execute(config.github.base);

			if (spinner) spinner.text = "Calling LLM...";
			let generated = await generatePr.execute(context, config.generation.provider, config.generation.model);

			const maxRetries = config.generation.validationRetries;

			for (let attempt = 0; attempt < maxRetries; attempt++) {
				if (spinner) spinner.text = `Validating (attempt ${String(attempt + 1)}/${String(maxRetries)})...`;
				const lintContext = { ...context, body: generated.body, title: generated.title };
				const result = await lintPr.execute(lintContext, config.lint, config.ticket);

				if (result.pass) {
					spinner?.stop();

					if (options.isJson) {
						console.log(JSON.stringify({ lint: result, ...generated }, null, 2));
					} else {
						console.log(chalk.bold.cyan("Fixed PR"));
						console.log(chalk.gray("─".repeat(40)));
						console.log(`${chalk.bold("Title:")} ${generated.title}\n`);
						console.log(generated.body);
						console.log();
						console.log(HumanPresenter.presentLintResult(result));
					}

					return;
				}

				if (spinner) spinner.text = `Fixing issues (attempt ${String(attempt + 1)}/${String(maxRetries)})...`;
				generated = await fixPr.execute(lintContext, config.generation.provider, config.generation.model, result.issues);
			}

			spinner?.fail("Could not produce lint-passing PR within retry limit");
			process.exitCode = 1;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			spinner?.fail(message);
			process.exitCode = 1;
		}
	}
}
