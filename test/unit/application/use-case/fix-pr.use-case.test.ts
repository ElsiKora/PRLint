import { FixPrUseCase } from "@/application/use-case/fix-pr.use-case";
import { ELlmProvider } from "@/domain/enum/llm-provider.enum";
import { EPrLintIssueCode } from "@/domain/enum/pr-lint-issue-code.enum";
import type { IPrContext } from "@/domain/interface/pr-context.interface";
import type { IPrLintIssue } from "@/domain/interface/pr-lint-issue.interface";
import type { ILlmService } from "@/application/interface/llm-service.interface";

function buildContext(): IPrContext {
	return {
		body: "## Summary\nOriginal body",
		branch: "feature/ABC-123",
		diff: "diff content",
		files: ["file.ts"],
		ticketId: "ABC-123",
		title: "bad title",
	};
}

const SAMPLE_ISSUES: Array<IPrLintIssue> = [
	{ code: EPrLintIssueCode.TITLE_FORMAT, details: "Title does not match pattern" },
	{ code: EPrLintIssueCode.BODY_SECTIONS_ORDER, details: "Missing required section: ## Changes" },
];

describe("FixPrUseCase", () => {
	let mockLlm: ILlmService;
	let useCase: FixPrUseCase;

	beforeEach(() => {
		mockLlm = {
			generate: vi.fn().mockResolvedValue({ body: "Fixed body", title: "Fixed title" }),
			getProvider: vi.fn().mockReturnValue(ELlmProvider.OPENAI),
		};
		useCase = new FixPrUseCase([mockLlm]);
	});

	it("returns fixed result when lint passes after regeneration", async () => {
		const result = await useCase.execute(buildContext(), ELlmProvider.OPENAI, "gpt-4", SAMPLE_ISSUES);

		expect(result.title).toBe("Fixed title");
		expect(result.body).toBe("Fixed body");
		expect(mockLlm.generate).toHaveBeenCalledTimes(1);

		const callArg = vi.mocked(mockLlm.generate).mock.calls[0]![0];

		expect(callArg.body).toContain("## Lint Issues to Fix");
		expect(callArg.body).toContain("[title_format]");
		expect(callArg.body).toContain("[body_sections_order]");
	});

	it("returns undefined when retries exhausted", async () => {
		vi.mocked(mockLlm.generate).mockRejectedValue(new Error("LLM unavailable"));

		await expect(useCase.execute(buildContext(), ELlmProvider.OPENAI, "gpt-4", SAMPLE_ISSUES)).rejects.toThrow("LLM unavailable");
	});
});
