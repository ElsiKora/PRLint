import type { IContainer } from "@elsikora/cladi";
import type { Ora } from "ora";

import type { ICliInterfaceService } from "../../../application/interface/cli-interface-service.interface";
import type { IConfigService } from "../../../application/interface/config-service.interface";
import type { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import type { LintPrUseCase } from "../../../application/use-case/lint-pr.use-case";
import type { IPrContext } from "../../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../../domain/interface/pr-lint-result.interface";
import type { IPrLintFullConfig } from "../../../domain/interface/prlint-config.interface";

import ora from "ora";

import { CliInterfaceServiceToken, CollectContextUseCaseToken, ConfigServiceToken, LintPrUseCaseToken } from "../../../infrastructure/di/token.constant";
import { HumanPresenter } from "../../presenter/human.presenter";
import { JsonPresenter } from "../../presenter/json.presenter";

/** CLI command that lints the current PR against configured rules. */
export class LintCommand {
	private readonly CONTAINER: IContainer;

	constructor(container: IContainer) {
		this.CONTAINER = container;
	}

	/**
	 * @param {object} options - Command options.
	 * @param {boolean} options.isJson - Whether to output as JSON.
	 */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner: Ora | undefined = options.isJson ? undefined : ora("Linting PR...").start();

		try {
			const cliInterface: ICliInterfaceService | undefined = this.CONTAINER.get<ICliInterfaceService>(CliInterfaceServiceToken);

			if (!cliInterface) {
				throw new Error("CliInterfaceService not registered in container");
			}

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

			const config: IPrLintFullConfig = await configService.get();
			const context: IPrContext = await collectContext.execute(config.github.base);
			const result: IPrLintResult = lintPr.execute(context, config.lint, config.ticket);

			spinner?.stop();

			const output: string = options.isJson ? JsonPresenter.presentLintResult(result) : HumanPresenter.presentLintResult(result);
			cliInterface.log(output);

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
