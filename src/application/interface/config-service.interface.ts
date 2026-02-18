import type { IPrLintFullConfig } from "../../domain/interface/prlint-config.interface";

/** Abstraction for loading, saving, and merging PRLint configuration. */
export interface IConfigService {
	/** @returns Whether a configuration file exists on disk. */
	exists(): Promise<boolean>;

	/** @returns The fully resolved configuration merged with defaults. */
	get(): Promise<IPrLintFullConfig>;

	/** Merges a partial config into the existing configuration. @param partial - Partial configuration to merge. */
	merge(partial: Partial<IPrLintFullConfig>): Promise<void>;

	/** Saves a complete configuration to disk. @param config - Full configuration to persist. */
	save(config: IPrLintFullConfig): Promise<void>;
}
