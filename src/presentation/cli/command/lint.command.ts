import type { IContainer } from "@elsikora/cladi";
import ora from "ora";

import type { IConfigService } from "../../../application/interface/config-service.interface";
import { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import { LintPrUseCase } from "../../../application/use-case/lint-pr.use-case";
import { CollectContextUseCaseToken, ConfigServiceToken, LintPrUseCaseToken } from "../../../infrastructure/di/token.constant";
import { HumanPresenter } from "../../presenter/human.presenter";
import { JsonPresenter } from "../../presenter/json.presenter";

/** CLI command that lints the current PR against configured rules. */
export class LintCommand {
	constructor(private readonly CONTAINER: IContainer) {}

	/** @param options - Command options. */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner = options.isJson ? undefined : ora("Linting PR...").start();

		try {
			const configService = this.CONTAINER.get<IConfigService>(ConfigServiceToken)!;
			const collectContext = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken)!;
			const lintPr = this.CONTAINER.get<LintPrUseCase>(LintPrUseCaseToken)!;

			const config = await configService.get();
			const context = await collectContext.execute(config.github.base);
			const result = await lintPr.execute(context, config.lint, config.ticket);

			spinner?.stop();

			const output = options.isJson ? JsonPresenter.presentLintResult(result) : HumanPresenter.presentLintResult(result);
			console.log(output);

			if (!result.pass) {
				process.exitCode = 1;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			spinner?.fail(message);
			process.exitCode = 1;
		}
	}
}
