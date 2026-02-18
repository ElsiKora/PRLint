import { cosmiconfig } from "cosmiconfig";

import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config-service.interface";

/** Loads git-branch-lint configuration via cosmiconfig. */
export class CosmicBranchLintConfigService implements IBranchLintConfigService {
	private readonly EXPLORER = cosmiconfig("git-branch-lint");

	/** @returns The loaded branch-lint config, or undefined if not found. */
	async getConfig(): Promise<Record<string, unknown> | undefined> {
		const result = await this.EXPLORER.search();

		if (!result || result.isEmpty) {
			return undefined;
		}

		return result.config as Record<string, unknown>;
	}
}
