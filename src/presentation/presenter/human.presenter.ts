import chalk from "chalk";

import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { IPrLintResult } from "../../domain/interface/pr-lint-result.interface";

/** Formats domain results for human-readable terminal output. */
export class HumanPresenter {
	/** @param context - PR context to format. @returns Colored terminal string. */
	static presentContext(context: IPrContext): string {
		const lines: Array<string> = [
			chalk.bold.cyan("PR Context"),
			chalk.gray("─".repeat(40)),
			`${chalk.bold("Branch:")}  ${context.branch}`,
			`${chalk.bold("Ticket:")}  ${context.ticketId ?? chalk.dim("none")}`,
			`${chalk.bold("Files:")}   ${String(context.files.length)} changed`,
		];

		if (context.files.length > 0) {
			for (const file of context.files) {
				lines.push(`  ${chalk.dim("•")} ${file}`);
			}
		}

		if (context.title) {
			lines.push(`${chalk.bold("Title:")}   ${context.title}`);
		}

		if (context.diff) {
			lines.push(`${chalk.bold("Diff:")}    ${String(context.diff.split("\n").length)} lines`);
		}

		return lines.join("\n");
	}

	/** @param result - Lint result to format. @returns Colored terminal string with pass/fail status. */
	static presentLintResult(result: IPrLintResult): string {
		const lines: Array<string> = [];

		if (result.pass) {
			lines.push(chalk.green.bold("✔ PR lint passed"));
		} else {
			lines.push(chalk.red.bold(`✘ PR lint failed — ${String(result.issues.length)} issue(s)`));
			lines.push(chalk.gray("─".repeat(40)));

			for (const issue of result.issues) {
				lines.push(`  ${chalk.red("•")} ${chalk.yellow(`[${issue.code}]`)} ${issue.details}`);
			}
		}

		return lines.join("\n");
	}
}
