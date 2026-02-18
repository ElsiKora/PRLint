import type { IContainer } from "@elsikora/cladi";
import chalk from "chalk";
import ora from "ora";

import type { IConfigService } from "../../../application/interface/config-service.interface";
import type { IGitRepoService } from "../../../application/interface/git-repo.interface";
import { CollectContextUseCase } from "../../../application/use-case/collect-context.use-case";
import { CreateOrUpdatePrUseCase } from "../../../application/use-case/create-or-update-pr.use-case";
import { GeneratePrUseCase } from "../../../application/use-case/generate-pr.use-case";
import { CollectContextUseCaseToken, ConfigServiceToken, CreateOrUpdatePrUseCaseToken, GeneratePrUseCaseToken, GitRepoServiceToken } from "../../../infrastructure/di/token.constant";

/** CLI command that generates PR content and creates or updates a GitHub PR (idempotent). */
export class CreateCommand {
	constructor(private readonly CONTAINER: IContainer) {}

	/** @param options - Command options. */
	async execute(options: { isJson?: boolean }): Promise<void> {
		const spinner = options.isJson ? undefined : ora("Preparing PR...").start();

		try {
			const configService = this.CONTAINER.get<IConfigService>(ConfigServiceToken)!;
			const collectContext = this.CONTAINER.get<CollectContextUseCase>(CollectContextUseCaseToken)!;
			const generatePr = this.CONTAINER.get<GeneratePrUseCase>(GeneratePrUseCaseToken)!;
			const createOrUpdatePr = this.CONTAINER.get<CreateOrUpdatePrUseCase>(CreateOrUpdatePrUseCaseToken)!;
			const gitRepoService = this.CONTAINER.get<IGitRepoService>(GitRepoServiceToken)!;

			const config = await configService.get();
			const context = await collectContext.execute(config.github.base);

			if (spinner) spinner.text = "Generating PR content...";
			const generated = await generatePr.execute(context, config.generation.provider, config.generation.model);

			if (spinner) spinner.text = "Creating/updating PR...";
			const branch = await gitRepoService.getBranchName();
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
