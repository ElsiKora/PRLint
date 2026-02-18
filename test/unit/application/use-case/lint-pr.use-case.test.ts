import { LintPrUseCase } from "@/application/use-case/lint-pr.use-case";
import { DEFAULT_FORBIDDEN_PLACEHOLDERS } from "@/domain/constant/forbidden-placeholders.constant";
import { DEFAULT_REQUIRED_SECTIONS } from "@/domain/constant/default-sections.constant";
import { DEFAULT_TITLE_PATTERN } from "@/domain/constant/default-title-pattern.constant";
import { EPrLintIssueCode } from "@/domain/enum/pr-lint-issue-code.enum";
import { ETicketNormalization } from "@/domain/enum/ticket-normalization.enum";
import { ETicketSource } from "@/domain/enum/ticket-source.enum";
import type { IPrContext } from "@/domain/interface/pr-context.interface";
import type { IPrLintConfig } from "@/domain/interface/pr-lint-config.interface";
import type { ITicketConfig } from "@/domain/interface/ticket-config.interface";

function buildContext(overrides: Partial<IPrContext> = {}): IPrContext {
	return {
		body: DEFAULT_REQUIRED_SECTIONS.map((s) => `## ${s}\nContent for ${s}`).join("\n\n"),
		branch: "feature/ABC-123-add-login",
		diff: "diff --git a/file.ts",
		files: ["file.ts"],
		ticketId: "ABC-123",
		title: "feat(core): add login | ABC-123",
		...overrides,
	};
}

function buildLintConfig(overrides: Partial<IPrLintConfig> = {}): IPrLintConfig {
	return {
		forbiddenPlaceholders: [...DEFAULT_FORBIDDEN_PLACEHOLDERS],
		requiredSections: [...DEFAULT_REQUIRED_SECTIONS],
		titlePattern: DEFAULT_TITLE_PATTERN,
		...overrides,
	};
}

function buildTicketConfig(overrides: Partial<ITicketConfig> = {}): ITicketConfig {
	return {
		normalization: ETicketNormalization.UPPER,
		pattern: "[A-Za-z]{2,}-\\d+",
		patternFlags: "",
		source: ETicketSource.BRANCH_LINT,
		...overrides,
	};
}

describe("LintPrUseCase", () => {
	let useCase: LintPrUseCase;

	beforeEach(() => {
		useCase = new LintPrUseCase();
	});

	it("passes when title matches pattern, all sections present, no forbidden placeholders", async () => {
		const result = await useCase.execute(buildContext(), buildLintConfig(), buildTicketConfig());

		expect(result.pass).toBe(true);
		expect(result.issues).toHaveLength(0);
	});

	it("fails on invalid title format", async () => {
		const context = buildContext({ title: "bad title no pattern" });
		const result = await useCase.execute(context, buildLintConfig(), buildTicketConfig());

		expect(result.pass).toBe(false);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: EPrLintIssueCode.TITLE_FORMAT }),
			]),
		);
	});

	it("fails on missing required section", async () => {
		const context = buildContext({ body: "## Summary\nOnly one section here" });
		const result = await useCase.execute(context, buildLintConfig());

		expect(result.pass).toBe(false);

		const sectionIssues = result.issues.filter((i) => i.code === EPrLintIssueCode.BODY_SECTIONS_ORDER);

		expect(sectionIssues.length).toBeGreaterThanOrEqual(1);
	});

	it("fails on forbidden placeholder in body", async () => {
		const context = buildContext({
			body: DEFAULT_REQUIRED_SECTIONS.map((s) => `## ${s}\nTODO: fill this in`).join("\n\n"),
		});
		const result = await useCase.execute(context, buildLintConfig());

		expect(result.pass).toBe(false);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER }),
			]),
		);
	});

	it("fails on forbidden placeholder in title", async () => {
		const context = buildContext({ title: "WIP feat(core): add login | ABC-123" });
		const result = await useCase.execute(context, buildLintConfig());

		expect(result.pass).toBe(false);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER }),
			]),
		);
	});

	it("fails on ticket correlation mismatch", async () => {
		const context = buildContext({
			ticketId: "XY-999",
			title: "feat(core): add login | ABC-123",
		});
		const result = await useCase.execute(context, buildLintConfig(), buildTicketConfig());

		expect(result.pass).toBe(false);
		expect(result.issues).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ code: EPrLintIssueCode.TICKET_CORRELATION }),
			]),
		);
	});

	it("passes with no ticket config (ticket correlation skipped)", async () => {
		const context = buildContext({ ticketId: "XY-999", title: "feat(core): add login | ABC-123" });
		const result = await useCase.execute(context, buildLintConfig());

		expect(result.pass).toBe(true);
		expect(result.issues).toHaveLength(0);
	});
});
