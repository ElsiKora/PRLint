import { cosmiconfig } from "cosmiconfig";

import { DEFAULT_FORBIDDEN_PLACEHOLDERS } from "../../domain/constant/forbidden-placeholders.constant";
import { DEFAULT_REQUIRED_SECTIONS } from "../../domain/constant/default-sections.constant";
import { DEFAULT_TITLE_PATTERN } from "../../domain/constant/default-title-pattern.constant";
import { ELlmProvider } from "../../domain/enum/llm-provider.enum";
import { ETicketNormalization } from "../../domain/enum/ticket-normalization.enum";
import { ETicketSource } from "../../domain/enum/ticket-source.enum";
import type { IPrLintFullConfig } from "../../domain/interface/prlint-config.interface";
import type { IConfigService } from "../../application/interface/config-service.interface";

const SEARCH_PLACES: Array<string> = [
	".elsikora/prlint.config.cjs",
	".elsikora/prlint.config.js",
	".elsikora/prlint.config.json",
	".elsikora/prlint.config.mjs",
	".elsikora/prlint.config.ts",
	".elsikora/prlint.config.yaml",
	".elsikora/prlint.config.yml",
];

const DEFAULT_CONFIG: IPrLintFullConfig = {
	generation: {
		model: "gpt-4o-mini",
		provider: ELlmProvider.OPENAI,
		retries: 3,
		validationRetries: 3,
	},
	github: {
		base: "main",
		draft: false,
	},
	lint: {
		forbiddenPlaceholders: DEFAULT_FORBIDDEN_PLACEHOLDERS,
		requiredSections: DEFAULT_REQUIRED_SECTIONS,
		titlePattern: DEFAULT_TITLE_PATTERN,
	},
	ticket: {
		normalization: ETicketNormalization.PRESERVE,
		pattern: "[a-z]{2,}-[0-9]+",
		patternFlags: "i",
		source: ETicketSource.AUTO,
	},
};

/** Loads PRLint configuration via cosmiconfig with caching and default merging. */
export class CosmicConfigService implements IConfigService {
	private cachedConfig: IPrLintFullConfig | undefined;

	private readonly EXPLORER = cosmiconfig("prlint", { searchPlaces: SEARCH_PLACES });

	/** @returns Whether a prlint config file exists on disk. */
	async exists(): Promise<boolean> {
		const result = await this.EXPLORER.search();

		return result !== null && result !== undefined;
	}

	/** @returns Fully resolved config merged with defaults. */
	async get(): Promise<IPrLintFullConfig> {
		if (this.cachedConfig) {
			return this.cachedConfig;
		}

		const result = await this.EXPLORER.search();
		const loaded = (result?.config as Partial<IPrLintFullConfig>) ?? {};

		this.cachedConfig = {
			generation: { ...DEFAULT_CONFIG.generation, ...loaded.generation },
			github: { ...DEFAULT_CONFIG.github, ...loaded.github },
			lint: { ...DEFAULT_CONFIG.lint, ...loaded.lint },
			ticket: { ...DEFAULT_CONFIG.ticket, ...loaded.ticket },
		};

		return this.cachedConfig;
	}

	/** @param partial - Partial config to deep-merge into the current configuration. */
	async merge(partial: Partial<IPrLintFullConfig>): Promise<void> {
		const current = await this.get();

		this.cachedConfig = {
			generation: { ...current.generation, ...partial.generation },
			github: { ...current.github, ...partial.github },
			lint: { ...current.lint, ...partial.lint },
			ticket: { ...current.ticket, ...partial.ticket },
		};
	}

	/** @param config - Full config to cache (does not persist to disk). */
	async save(config: IPrLintFullConfig): Promise<void> {
		this.cachedConfig = config;
	}
}
