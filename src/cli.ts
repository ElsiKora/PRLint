import type { IContainer } from "@elsikora/cladi";

import yargs, { type Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { CONFIG_MODULE_NAME } from "./application/constant/config-module-name.constant";
import { createAppContainer } from "./infrastructure/di/container";
import { ContextCommand } from "./presentation/cli/command/context.command";
import { CreateCommand } from "./presentation/cli/command/create.command";
import { FixCommand } from "./presentation/cli/command/fix.command";
import { GenerateCommand } from "./presentation/cli/command/generate.command";
import { LintCommand } from "./presentation/cli/command/lint.command";

export * from "./index";

/** Boots the CLI, registers all commands, and parses argv. */
async function main(): Promise<void> {
	const container: IContainer = createAppContainer();

	await yargs(hideBin(process.argv))
		.scriptName(CONFIG_MODULE_NAME)
		.usage("$0 <command> [options]")
		.command(
			"context",
			"Collect and display PR context",
			(y: Argv) => y.option("json", { alias: "j", description: "Output as JSON", type: "boolean" }),
			async (argv: Record<string, unknown>) => {
				const isJson: boolean | undefined = argv.json as boolean | undefined;
				await new ContextCommand(container).execute({ isJson });
			},
		)
		.command(
			"create",
			"Generate content and create or update a GitHub PR",
			(y: Argv) => y.option("json", { alias: "j", description: "Output as JSON", type: "boolean" }),
			async (argv: Record<string, unknown>) => {
				const isJson: boolean | undefined = argv.json as boolean | undefined;
				await new CreateCommand(container).execute({ isJson });
			},
		)
		.command(
			"fix",
			"Generate, lint, and iteratively fix PR content",
			(y: Argv) => y.option("json", { alias: "j", description: "Output as JSON", type: "boolean" }),
			async (argv: Record<string, unknown>) => {
				const isJson: boolean | undefined = argv.json as boolean | undefined;
				await new FixCommand(container).execute({ isJson });
			},
		)
		.command(
			"generate",
			"Generate a PR title and body using AI",
			(y: Argv) => y.option("json", { alias: "j", description: "Output as JSON", type: "boolean" }),
			async (argv: Record<string, unknown>) => {
				const isJson: boolean | undefined = argv.json as boolean | undefined;
				await new GenerateCommand(container).execute({ isJson });
			},
		)
		.command(
			"lint",
			"Lint the current PR against configured rules",
			(y: Argv) => y.option("json", { alias: "j", description: "Output as JSON", type: "boolean" }),
			async (argv: Record<string, unknown>) => {
				const isJson: boolean | undefined = argv.json as boolean | undefined;
				await new LintCommand(container).execute({ isJson });
			},
		)
		.demandCommand(1, "Please specify a command")
		.strict()
		.help()
		.parse();
}

main().catch((error: unknown) => {
	console.error(error);
	process.exitCode = 1;
});
