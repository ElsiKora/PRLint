import type { IContainer } from "@elsikora/cladi";
import ora from "ora";

import type { IConfigService } from "../../../application/interface/config-service.interface";
import { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import { CollectContextUseCaseToken, ConfigServiceToken } from "../../../infrastructure/di/token.constant";
import { HumanPresenter } from "../../presenter/human.presenter";
import { JsonPresenter } from "../../presenter/json.presenter";

/** CLI command that collects and displays PR context. */
export class ContextCommand {
	constructor(private readonly CONTAINER: IContainer) {}

	/** @param options - Command options. */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner = options.isJson ? undefined : ora("Collecting PR context...").start();

		try {
			const configService = this.CONTAINER.get<IConfigService>(ConfigServiceToken)!;
			const collectContext = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken)!;

			const config = await configService.get();
			const context = await collectContext.execute(config.github.base);

			spinner?.stop();

			const output = options.isJson ? JsonPresenter.presentContext(context) : HumanPresenter.presentContext(context);
			console.log(output);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			spinner?.fail(message);
			process.exitCode = 1;
		}
	}
}
