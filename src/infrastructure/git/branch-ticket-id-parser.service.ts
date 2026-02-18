import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config-service.interface";
import type { IConfigService } from "../../application/interface/config-service.interface";
import type { ITicketIdParser } from "../../application/interface/ticket-id-parser.interface";
import { ETicketSource } from "../../domain/enum/ticket-source.enum";
import type { ITicketConfig } from "../../domain/interface/ticket-config.interface";
import { TicketId } from "../../domain/value-object/ticket-id.value-object";

/** Extracts a ticket identifier from a branch name using configurable strategies. */
export class BranchTicketIdParser implements ITicketIdParser {
	constructor(
		private readonly CONFIG_SERVICE: IConfigService,
		private readonly BRANCH_LINT_CONFIG_SERVICE: IBranchLintConfigService,
	) {}

	/** @param branchName - Git branch name to parse. @returns Parsed ticket ID or undefined. */
	async parse(branchName: string): Promise<TicketId | undefined> {
		const config = await this.CONFIG_SERVICE.get();
		const ticketConfig = config.ticket;

		switch (ticketConfig.source) {
			case ETicketSource.AUTO: {
				return (await this.fromBranchLint(branchName, ticketConfig)) ?? this.fromPattern(branchName, ticketConfig);
			}

			case ETicketSource.BRANCH_LINT: {
				return this.fromBranchLint(branchName, ticketConfig);
			}

			case ETicketSource.NONE: {
				return undefined;
			}

			case ETicketSource.PATTERN: {
				return this.fromPattern(branchName, ticketConfig);
			}
		}
	}

	private async fromBranchLint(branchName: string, ticketConfig: ITicketConfig): Promise<TicketId | undefined> {
		const blConfig = await this.BRANCH_LINT_CONFIG_SERVICE.getConfig();

		if (!blConfig) {
			return undefined;
		}

		const pattern = blConfig["pattern"] as string | undefined;

		if (!pattern) {
			return undefined;
		}

		try {
			const regex = new RegExp(pattern);
			const match = regex.exec(branchName);

			if (match?.groups?.["ticket"]) {
				return new TicketId(match.groups["ticket"], ticketConfig.normalization);
			}
		} catch {
			return undefined;
		}

		return undefined;
	}

	private fromPattern(branchName: string, ticketConfig: ITicketConfig): TicketId | undefined {
		const regex = new RegExp(ticketConfig.pattern, ticketConfig.patternFlags);
		const match = regex.exec(branchName);

		if (!match) {
			return undefined;
		}

		return new TicketId(match[0], ticketConfig.normalization);
	}
}
