import { CreateOrUpdatePrUseCase } from "@/application/use-case/create-or-update-pr.use-case";
import type { IGitHubRepoService } from "@/application/interface/github-repo.interface";

describe("CreateOrUpdatePrUseCase", () => {
	let mockGitHub: IGitHubRepoService;
	let useCase: CreateOrUpdatePrUseCase;

	beforeEach(() => {
		mockGitHub = {
			createPr: vi.fn().mockResolvedValue(42),
			findOpenPr: vi.fn().mockResolvedValue(undefined),
			updatePr: vi.fn().mockResolvedValue(undefined),
		};
		useCase = new CreateOrUpdatePrUseCase(mockGitHub);
	});

	it("creates new PR when no existing found", async () => {
		const prNumber = await useCase.execute("Title", "Body", "feature/x", "main", false);

		expect(prNumber).toBe(42);
		expect(mockGitHub.findOpenPr).toHaveBeenCalledWith("feature/x", "main");
		expect(mockGitHub.createPr).toHaveBeenCalledWith("Title", "Body", "feature/x", "main", false);
		expect(mockGitHub.updatePr).not.toHaveBeenCalled();
	});

	it("updates existing PR when found", async () => {
		vi.mocked(mockGitHub.findOpenPr).mockResolvedValue(7);

		const prNumber = await useCase.execute("New Title", "New Body", "feature/x", "main", true);

		expect(prNumber).toBe(7);
		expect(mockGitHub.updatePr).toHaveBeenCalledWith(7, "New Title", "New Body");
		expect(mockGitHub.createPr).not.toHaveBeenCalled();
	});
});
