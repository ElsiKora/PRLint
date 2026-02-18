import type { IPrContext } from "../../domain/interface/pr-context.interface";
import type { TicketId } from "../../domain/value-object/ticket-id.value-object";
import type { IGitRepoService } from "../interface/git-repo.interface";
import type { ITicketIdParser } from "../interface/ticket-id-parser.interface";

/** Collects all contextual information needed for PR linting and generation. */
export class CollectContextUseCase {
	private readonly GIT_REPO: IGitRepoService;

	private readonly TICKET_ID_PARSER: ITicketIdParser;

	constructor(gitRepo: IGitRepoService, ticketIdParser: ITicketIdParser) {
		this.GIT_REPO = gitRepo;
		this.TICKET_ID_PARSER = ticketIdParser;
	}

	/**
	 * @param {string} base - The base branch to diff against.
	 * @returns {Promise<IPrContext>} Collected PR context.
	 */
	async execute(base: string): Promise<IPrContext> {
		const [branch, diff, files]: [string, string, Array<string>] = await Promise.all([this.GIT_REPO.getBranchName(), this.GIT_REPO.getDiff(base), this.GIT_REPO.getFiles(base)]);

		const ticketId: TicketId | undefined = await this.TICKET_ID_PARSER.parse(branch);

		return {
			body: "",
			branch,
			diff,
			files,
			ticketId: ticketId?.getValue(),
			title: "",
		};
	}
}
