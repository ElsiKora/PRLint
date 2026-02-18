import type { IGitHubConfig } from "./github-config.interface";
import type { IPrGenerationConfig } from "./pr-generation-config.interface";
import type { IPrLintConfig } from "./pr-lint-config.interface";
import type { ITicketConfig } from "./ticket-config.interface";

export interface IPrLintFullConfig {
	generation: IPrGenerationConfig;
	github: IGitHubConfig;
	lint: IPrLintConfig;
	ticket: ITicketConfig;
}
