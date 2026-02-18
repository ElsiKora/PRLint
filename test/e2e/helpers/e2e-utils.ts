import type { SpawnSyncReturns } from "node:child_process";

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// eslint-disable-next-line @elsikora/unicorn/prevent-abbreviations
const __dirname: string = path.dirname(fileURLToPath(import.meta.url));

export const CLI_BIN_PATH: string = path.resolve(__dirname, "../../../bin/cli.js");

const CLI_TIMEOUT_MS: number = 10_000;

export interface ICliResult {
	exitCode: number;
	stderr: string;
	stdout: string;
}

/** Spawns the built CLI binary with the given arguments and returns captured output. */
export function runCli(cliArguments: Array<string> = []): ICliResult {
	const result: SpawnSyncReturns<string> = spawnSync("node", [CLI_BIN_PATH, ...cliArguments], {
		encoding: "utf8",
		timeout: CLI_TIMEOUT_MS,
	});

	return {
		exitCode: result.status ?? 1,
		stderr: result.stderr ?? "",
		stdout: result.stdout ?? "",
	};
}
