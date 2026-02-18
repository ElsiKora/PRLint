import type { ICommandService } from "../../application/interface/command-service.interface";

import { execSync } from "node:child_process";

import { COMMAND_PREVIEW_WORD_COUNT } from "../../domain/constant/numeric.constant";

/** Executes shell commands using Node.js child_process. */
export class NodeCommandService implements ICommandService {
	/**
	 * @param {string} command - Shell command to execute.
	 * @returns {Promise<string>} Trimmed stdout output.
	 */
	execute(command: string): Promise<string> {
		try {
			// eslint-disable-next-line @elsikora/sonar/os-command
			const output: string = execSync(command, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

			return Promise.resolve(output.trim());
		} catch (error: unknown) {
			const stderr: string = (error as { stderr?: string }).stderr?.trim() ?? "";
			const message: string = stderr || (error instanceof Error ? error.message : String(error));

			const cleanMessage: string = message
				.split("\n")
				.filter((line: string) => !line.startsWith("Use '--' to separate"))
				.filter((line: string) => !line.startsWith("'git <command>"))
				.map((line: string) => line.replace(/^fatal:\s*/, ""))
				.join(" ")
				.trim();

			return Promise.reject(new Error(`Command \`${command.split(" ").slice(0, COMMAND_PREVIEW_WORD_COUNT).join(" ")}\` failed: ${cleanMessage}`));
		}
	}
}
