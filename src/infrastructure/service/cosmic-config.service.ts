import type { IConfigService } from "../../application/interface/config-service.interface";
import type { IPrLintFullConfig } from "../../domain/interface/prlint-config.interface";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cosmiconfig } from "cosmiconfig";
import { stringify } from "javascript-stringify";

import { CONFIG_FILE_DIRECTORY } from "../../application/constant/config-file-directory.constant";
import { CONFIG_MODULE_NAME } from "../../application/constant/config-module-name.constant";
import { DEFAULT_REQUIRED_SECTIONS } from "../../domain/constant/default-sections.constant";
import { DEFAULT_TITLE_PATTERN } from "../../domain/constant/default-title-pattern.constant";
import { DEFAULT_FORBIDDEN_PLACEHOLDERS } from "../../domain/constant/forbidden-placeholders.constant";
import { DEFAULT_BASE_BRANCH, DEFAULT_PROHIBITED_BRANCHES, IS_DEFAULT_DRAFT } from "../../domain/constant/github.constant";
import { DEFAULT_MAX_RETRIES, DEFAULT_VALIDATION_MAX_RETRIES } from "../../domain/constant/numeric.constant";
import { DEFAULT_TICKET_PATTERN_FLAGS, DEFAULT_TICKET_PATTERN_SOURCE } from "../../domain/constant/ticket.constant";
import { ETicketMissingBranchLintBehavior } from "../../domain/enum/ticket-missing-branch-lint-behavior.enum";
import { ETicketNormalization } from "../../domain/enum/ticket-normalization.enum";
import { ETicketSource } from "../../domain/enum/ticket-source.enum";

const DEFAULT_CONFIG: IPrLintFullConfig = {
	generation: {
		retries: DEFAULT_MAX_RETRIES,
		validationRetries: DEFAULT_VALIDATION_MAX_RETRIES,
	},
	github: {
		base: DEFAULT_BASE_BRANCH,
		isDraft: IS_DEFAULT_DRAFT,
		prohibitedBranches: DEFAULT_PROHIBITED_BRANCHES,
	},
	lint: {
		forbiddenPlaceholders: DEFAULT_FORBIDDEN_PLACEHOLDERS,
		requiredSections: DEFAULT_REQUIRED_SECTIONS,
		titlePattern: DEFAULT_TITLE_PATTERN,
	},
	ticket: {
		missingBranchLintBehavior: ETicketMissingBranchLintBehavior.FALLBACK,
		normalization: ETicketNormalization.PRESERVE,
		pattern: DEFAULT_TICKET_PATTERN_SOURCE,
		patternFlags: DEFAULT_TICKET_PATTERN_FLAGS,
		source: ETicketSource.AUTO,
	},
};

/** Loads PRLint configuration via cosmiconfig with caching and default merging. */
export class CosmicConfigService implements IConfigService {
	private cachedConfig: IPrLintFullConfig | undefined;

	private readonly EXPLORER: ReturnType<typeof cosmiconfig> = cosmiconfig(CONFIG_MODULE_NAME, {
		packageProp: `${CONFIG_FILE_DIRECTORY.replace(".", "")}.${CONFIG_MODULE_NAME}`,
		searchPlaces: [
			"package.json",
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.json`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.yaml`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.yml`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.js`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.ts`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.mjs`,
			`${CONFIG_FILE_DIRECTORY}/.${CONFIG_MODULE_NAME}rc.cjs`,
			`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.js`,
			`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.ts`,
			`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.mjs`,
			`${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.cjs`,
		],
	});

	/** @returns {Promise<boolean>} Whether a prlint config file exists on disk. */
	async exists(): Promise<boolean> {
		const result: Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>> = await this.EXPLORER.search();

		return result != null;
	}

	/** @returns {Promise<IPrLintFullConfig>} Fully resolved config merged with defaults. */
	async get(): Promise<IPrLintFullConfig> {
		if (this.cachedConfig) {
			return this.cachedConfig;
		}

		const result: Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>> = await this.EXPLORER.search();
		const loaded: Partial<IPrLintFullConfig> = (result?.config as Partial<IPrLintFullConfig>) ?? {};

		this.cachedConfig = {
			generation: { ...DEFAULT_CONFIG.generation, ...loaded.generation },
			github: { ...DEFAULT_CONFIG.github, ...loaded.github },
			lint: { ...DEFAULT_CONFIG.lint, ...loaded.lint },
			ticket: { ...DEFAULT_CONFIG.ticket, ...loaded.ticket },
		};

		return this.cachedConfig;
	}

	/**
	 * @param {Partial<IPrLintFullConfig>} partial - Partial config to deep-merge into the current configuration.
	 */
	async merge(partial: Partial<IPrLintFullConfig>): Promise<void> {
		const current: IPrLintFullConfig = await this.get();

		this.cachedConfig = {
			generation: { ...current.generation, ...partial.generation },
			github: { ...current.github, ...partial.github },
			lint: { ...current.lint, ...partial.lint },
			ticket: { ...current.ticket, ...partial.ticket },
		};
	}

	/**
	 * @param {IPrLintFullConfig} config - Full config to persist to disk and cache in memory.
	 */
	async save(config: IPrLintFullConfig): Promise<void> {
		this.cachedConfig = config;

		const result: Awaited<ReturnType<ReturnType<typeof cosmiconfig>["search"]>> = await this.EXPLORER.search();
		const filepath: string = result?.filepath ?? `${CONFIG_FILE_DIRECTORY}/${CONFIG_MODULE_NAME}.config.js`;

		const directory: string = path.dirname(filepath);
		await mkdir(directory, { ["recursive"]: true });

		const content: string = `export default ${stringify(config, null, "\t")};\n`;
		await writeFile(filepath, content, "utf8");
	}
}
