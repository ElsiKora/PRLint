import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config-service.interface";
import type { IBranchLintConfig } from "../../application/interface/branch-lint-config.interface";

import { cosmiconfig } from "cosmiconfig";

import { CONFIG_FILE_DIRECTORY } from "../../application/constant/config-file-directory.constant";
import { BRANCH_LINT_CONFIG_MODULE_NAME, BRANCH_LINT_PACKAGE_PROPERTY } from "../../domain/constant/ticket.constant";

/** Loads git-branch-lint configuration via cosmiconfig. */
export class CosmicBranchLintConfigService implements IBranchLintConfigService {
	private readonly EXPLORER: ReturnType<typeof cosmiconfig> = cosmiconfig(BRANCH_LINT_CONFIG_MODULE_NAME, {
		packageProp: BRANCH_LINT_PACKAGE_PROPERTY,
		searchPlaces: [
			"package.json",
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.json`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.yaml`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.yml`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.js`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.ts`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.mjs`,
			`${CONFIG_FILE_DIRECTORY}/.${BRANCH_LINT_CONFIG_MODULE_NAME}rc.cjs`,
			`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.js`,
			`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.ts`,
			`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.mjs`,
			`${CONFIG_FILE_DIRECTORY}/${BRANCH_LINT_CONFIG_MODULE_NAME}.config.cjs`,
		],
	});

	/** @returns {Promise<IBranchLintConfig | undefined>} The loaded branch-lint config, or undefined if not found. */
	async load(): Promise<IBranchLintConfig | undefined> {
		const result: Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>> = await this.EXPLORER.search();

		if (!result || result.isEmpty) {
			return undefined;
		}

		return result.config as IBranchLintConfig;
	}
}
