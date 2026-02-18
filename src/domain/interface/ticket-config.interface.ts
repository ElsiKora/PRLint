import type { ETicketNormalization } from "../enum/ticket-normalization.enum";
import type { ETicketSource } from "../enum/ticket-source.enum";

export interface ITicketConfig {
	normalization: ETicketNormalization;
	pattern: string;
	patternFlags: string;
	source: ETicketSource;
}
