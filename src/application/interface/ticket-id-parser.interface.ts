import type { TicketId } from "../../domain/value-object/ticket-id.value-object";

/** Abstraction for extracting a ticket identifier from a branch name. */
export interface ITicketIdParser {
	/** @param branchName - Git branch name to parse. @returns The parsed ticket ID, or undefined if none found. */
	parse(branchName: string): Promise<TicketId | undefined>;
}
