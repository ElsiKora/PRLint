import { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";
import type { IPrLintIssue } from "../interface/pr-lint-issue.interface";
import type { PrBody } from "../value-object/pr-body.value-object";
import type { PrTitle } from "../value-object/pr-title.value-object";
import type { TicketId } from "../value-object/ticket-id.value-object";

/** Validates that the ticket referenced in title/body matches the branch-derived ticket. */
export class TicketCorrelationPolicy {
	/** Returns an issue if the branch ticket is not found in the title or body. */
	public static validate(title: PrTitle, body: PrBody, ticketId: TicketId | undefined): IPrLintIssue | undefined {
		if (!ticketId) {
			return undefined;
		}

		const ticket: string = ticketId.getValue();
		const titleContainsTicket: boolean = title.getValue().includes(ticket);
		const bodyContainsTicket: boolean = body.getValue().includes(ticket);

		if (!titleContainsTicket && !bodyContainsTicket) {
			return {
				code: EPrLintIssueCode.TICKET_CORRELATION,
				details: `Ticket "${ticket}" from branch not found in title or body`,
			};
		}

		return undefined;
	}
}
