import { GeneratePrUseCase } from "@/application/use-case/generate-pr.use-case";
import { ELlmProvider } from "@/domain/enum/llm-provider.enum";
import type { IPrContext } from "@/domain/interface/pr-context.interface";
import type { ILlmService } from "@/application/interface/llm-service.interface";

function buildContext(): IPrContext {
	return {
		body: "",
		branch: "feature/ABC-123",
		diff: "diff content",
		files: ["file.ts"],
		ticketId: "ABC-123",
		title: "",
	};
}

describe("GeneratePrUseCase", () => {
	let mockLlm: ILlmService;
	let useCase: GeneratePrUseCase;

	beforeEach(() => {
		mockLlm = {
			generate: vi.fn().mockResolvedValue({ body: "Generated body", title: "Generated title" }),
			getProvider: vi.fn().mockReturnValue(ELlmProvider.OPENAI),
		};
		useCase = new GeneratePrUseCase([mockLlm]);
	});

	it("generates using matching provider", async () => {
		const result = await useCase.execute(buildContext(), ELlmProvider.OPENAI, "gpt-4");

		expect(result.title).toBe("Generated title");
		expect(result.body).toBe("Generated body");
		expect(mockLlm.generate).toHaveBeenCalledWith(buildContext(), "gpt-4");
	});

	it("throws when no matching provider", async () => {
		await expect(useCase.execute(buildContext(), ELlmProvider.ANTHROPIC, "claude-3")).rejects.toThrow(
			"No LLM service registered for provider: anthropic",
		);
	});

	it("retries on failure", async () => {
		vi.mocked(mockLlm.generate)
			.mockRejectedValueOnce(new Error("rate limit"))
			.mockResolvedValueOnce({ body: "Retry body", title: "Retry title" });

		await expect(useCase.execute(buildContext(), ELlmProvider.OPENAI, "gpt-4")).rejects.toThrow("rate limit");

		const result = await useCase.execute(buildContext(), ELlmProvider.OPENAI, "gpt-4");

		expect(result.title).toBe("Retry title");
		expect(mockLlm.generate).toHaveBeenCalledTimes(2);
	});
});
