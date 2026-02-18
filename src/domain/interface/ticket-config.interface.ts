import type { ETicketMissingBranchLintBehavior } from "../enum/ticket-missing-branch-lint-behavior.enum";
import type { ETicketNormalization } from "../enum/ticket-normalization.enum";
import type { ETicketSource } from "../enum/ticket-source.enum";

export interface ITicketConfig {
	missingBranchLintBehavior: ETicketMissingBranchLintBehavior;
	normalization: ETicketNormalization;
	pattern: string;
	patternFlags: string;
	source: ETicketSource;
}
