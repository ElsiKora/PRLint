import { execSync } from "node:child_process";

import type { ICommandService } from "../../application/interface/command-service.interface";

/** Executes shell commands using Node.js child_process. */
export class NodeCommandService implements ICommandService {
	/** @param command - Shell command to execute. @returns Trimmed stdout output. */
	async execute(command: string): Promise<string> {
		try {
			const output = execSync(command, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });

			return output.trim();
		} catch (error: unknown) {
			const stderr = (error as { stderr?: string }).stderr?.trim() ?? "";
			const message = stderr || (error instanceof Error ? error.message : String(error));
			const cleanMessage = message
				.split("\n")
				.filter((line: string) => !line.startsWith("Use '--' to separate"))
				.filter((line: string) => !line.startsWith("'git <command>"))
				.map((line: string) => line.replace(/^fatal:\s*/, ""))
				.join(" ")
				.trim();

			throw new Error(`Command \`${command.split(" ").slice(0, 3).join(" ")}\` failed: ${cleanMessage}`);
		}
	}
}
