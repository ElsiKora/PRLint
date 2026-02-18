import { CollectContextUseCase } from "@/application/use-case/collect-context.use-case";
import type { IGitRepoService } from "@/application/interface/git-repo.interface";
import type { ITicketIdParser } from "@/application/interface/ticket-id-parser.interface";
import { TicketId } from "@/domain/value-object/ticket-id.value-object";
import { ETicketNormalization } from "@/domain/enum/ticket-normalization.enum";

describe("CollectContextUseCase", () => {
	let mockGitRepo: IGitRepoService;
	let mockParser: ITicketIdParser;
	let useCase: CollectContextUseCase;

	beforeEach(() => {
		mockGitRepo = {
			getBranchName: vi.fn().mockResolvedValue("feature/ABC-123-login"),
			getDiff: vi.fn().mockResolvedValue("diff --git a/file.ts"),
			getFiles: vi.fn().mockResolvedValue(["src/file.ts"]),
			getRemoteUrl: vi.fn().mockResolvedValue("https://github.com/org/repo"),
		};
		mockParser = {
			parse: vi.fn().mockResolvedValue(new TicketId("ABC-123", ETicketNormalization.UPPER)),
		};
		useCase = new CollectContextUseCase(mockGitRepo, mockParser);
	});

	it("collects context with ticket", async () => {
		const result = await useCase.execute("main");

		expect(result.branch).toBe("feature/ABC-123-login");
		expect(result.diff).toBe("diff --git a/file.ts");
		expect(result.files).toEqual(["src/file.ts"]);
		expect(result.ticketId).toBe("ABC-123");
		expect(result.title).toBe("");
		expect(result.body).toBe("");
		expect(mockGitRepo.getDiff).toHaveBeenCalledWith("main");
		expect(mockGitRepo.getFiles).toHaveBeenCalledWith("main");
	});

	it("collects context without ticket", async () => {
		vi.mocked(mockParser.parse).mockResolvedValue(undefined);

		const result = await useCase.execute("main");

		expect(result.ticketId).toBeUndefined();
		expect(result.branch).toBe("feature/ABC-123-login");
	});
});
