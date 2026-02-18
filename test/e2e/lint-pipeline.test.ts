import { LintPrUseCase } from "@/application/use-case/lint-pr.use-case";
import { DEFAULT_REQUIRED_SECTIONS } from "@/domain/constant/default-sections.constant";
import { DEFAULT_TITLE_PATTERN } from "@/domain/constant/default-title-pattern.constant";
import { DEFAULT_FORBIDDEN_PLACEHOLDERS } from "@/domain/constant/forbidden-placeholders.constant";
import { EPrLintIssueCode } from "@/domain/enum/pr-lint-issue-code.enum";
import { ETicketMissingBranchLintBehavior } from "@/domain/enum/ticket-missing-branch-lint-behavior.enum";
import { ETicketNormalization } from "@/domain/enum/ticket-normalization.enum";
import { ETicketSource } from "@/domain/enum/ticket-source.enum";
import type { IPrContext } from "@/domain/interface/pr-context.interface";
import type { IPrLintConfig } from "@/domain/interface/pr-lint-config.interface";
import type { IPrLintIssue } from "@/domain/interface/pr-lint-issue.interface";
import type { IPrLintResult } from "@/domain/interface/pr-lint-result.interface";
import type { ITicketConfig } from "@/domain/interface/ticket-config.interface";
import { HumanPresenter } from "@/presentation/presenter/human.presenter";
import { JsonPresenter } from "@/presentation/presenter/json.presenter";

function buildValidBody(): string {
	return [
		"## Summary",
		"Added JWT-based authentication service for user login.",
		"",
		"## Scope",
		"Authentication module only.",
		"",
		"## Changes",
		"- Added AuthService class with JWT support",
		"- Added login endpoint handler",
		"- Added token refresh logic",
		"",
		"## Acceptance Criteria",
		"- Users can log in with valid credentials",
		"- JWT tokens are issued on successful login",
		"- Invalid credentials return 401",
		"",
		"## Test Plan",
		"- Unit tests for AuthService",
		"- Integration tests for login endpoint",
		"- Manual testing of token refresh",
		"",
		"## Risks",
		"Token expiration window needs production monitoring.",
		"",
		"## Linear",
		"ABC-123",
	].join("\n");
}

function buildContext(overrides: Partial<IPrContext> = {}): IPrContext {
	return {
		body: buildValidBody(),
		branch: "feature/ABC-123-add-authentication",
		diff: "diff --git a/src/auth.ts b/src/auth.ts\n+export class AuthService {\n+  validate(): boolean { return true; }\n+}",
		files: ["src/auth.ts", "src/auth.test.ts"],
		ticketId: "ABC-123",
		title: "feat(auth): add authentication service | ABC-123",
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
		missingBranchLintBehavior: ETicketMissingBranchLintBehavior.FALLBACK,
		normalization: ETicketNormalization.PRESERVE,
		pattern: "[A-Za-z]{2,}-\\d+",
		patternFlags: "",
		source: ETicketSource.BRANCH_LINT,
		...overrides,
	};
}

describe("Lint pipeline", () => {
	let useCase: LintPrUseCase;

	beforeEach(() => {
		useCase = new LintPrUseCase();
	});

	describe("valid PR", () => {
		it("passes all checks with a well-formed PR", () => {
			const result = useCase.execute(buildContext(), buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(true);
			expect(result.issues).toHaveLength(0);
		});

		it("produces JSON output with isPassed true and empty issues", () => {
			const result = useCase.execute(buildContext(), buildLintConfig(), buildTicketConfig());
			const json: string = JsonPresenter.presentLintResult(result);
			const parsed = JSON.parse(json) as IPrLintResult;

			expect(parsed.isPassed).toBe(true);
			expect(parsed.issues).toEqual([]);
		});
	});

	describe("title validation", () => {
		it("fails on title without conventional format", () => {
			const context = buildContext({ title: "add authentication" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.TITLE_FORMAT })]));
		});

		it("fails on title missing scope parentheses", () => {
			const context = buildContext({ title: "feat: add auth service | ABC-123" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.TITLE_FORMAT })]));
		});

		it("fails on title missing ticket suffix", () => {
			const context = buildContext({ title: "feat(auth): add auth service" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.TITLE_FORMAT })]));
		});

		it("fails on title with uppercase type", () => {
			const context = buildContext({ title: "FEAT(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.TITLE_FORMAT })]));
		});
	});

	describe("body sections", () => {
		it("fails when a required section is missing", () => {
			const context = buildContext({ body: "## Summary\nSome content only" });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);

			const sectionIssues = result.issues.filter((issue: IPrLintIssue) => issue.code === EPrLintIssueCode.BODY_SECTIONS_ORDER);

			expect(sectionIssues.length).toBeGreaterThanOrEqual(1);
		});

		it("reports each missing section individually", () => {
			const context = buildContext({ body: "No sections at all" });
			const result = useCase.execute(context, buildLintConfig());

			const sectionIssues = result.issues.filter((issue: IPrLintIssue) => issue.code === EPrLintIssueCode.BODY_SECTIONS_ORDER);

			expect(sectionIssues.length).toBe(DEFAULT_REQUIRED_SECTIONS.length);
		});

		it("fails when existing sections appear out of order", () => {
			const body = ["## Linear", "ABC-123", "", "## Summary", "Added authentication", "", "## Scope", "Auth module", "", "## Changes", "- Added auth", "", "## Acceptance Criteria", "- It works", "", "## Test Plan", "- Test it", "", "## Risks", "None"].join("\n");
			const context = buildContext({ body });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.BODY_SECTIONS_ORDER, details: expect.stringContaining("Section order is invalid") })]));
		});
	});

	describe("forbidden placeholders", () => {
		it("detects WIP placeholder in title", () => {
			const context = buildContext({ title: "WIP feat(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER, details: expect.stringContaining("WIP") })]));
		});

		it("detects TODO placeholder in body", () => {
			const body = DEFAULT_REQUIRED_SECTIONS.map((section: string) => `## ${section}\nTODO: fill this section`).join("\n\n");
			const context = buildContext({ body });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER, details: expect.stringContaining("TODO") })]));
		});

		it("does not flag placeholder that is part of a longer word", () => {
			const body = DEFAULT_REQUIRED_SECTIONS.map((section: string) => `## ${section}\nThe rapid SWIPING gesture triggers the animation`).join("\n\n");
			const context = buildContext({ body });
			const result = useCase.execute(context, buildLintConfig());

			const placeholderIssues = result.issues.filter((issue: IPrLintIssue) => issue.code === EPrLintIssueCode.FORBIDDEN_PLACEHOLDER);

			expect(placeholderIssues).toHaveLength(0);
		});

		it("detects HTML comment placeholder in body", () => {
			const body = DEFAULT_REQUIRED_SECTIONS.map((section: string) => `## ${section}\n<!-- Replace this content -->`).join("\n\n");
			const context = buildContext({ body });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER, details: expect.stringContaining("<!--") })]));
		});

		it("detects unchecked checkbox placeholder in body", () => {
			const body = DEFAULT_REQUIRED_SECTIONS.map((section: string) => `## ${section}\n- [ ] Something to check`).join("\n\n");
			const context = buildContext({ body });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER, details: expect.stringContaining("[ ]") })]));
		});
	});

	describe("ticket correlation", () => {
		it("fails when title ticket does not match branch ticket", () => {
			const context = buildContext({ ticketId: "XY-999", title: "feat(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.TICKET_CORRELATION })]));
		});

		it("skips correlation when no ticket config is provided", () => {
			const context = buildContext({ ticketId: "XY-999", title: "feat(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig());

			expect(result.isPassed).toBe(true);
		});

		it("skips correlation when context has no ticket", () => {
			const context = buildContext({ ticketId: undefined, title: "feat(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(true);
		});

		it("passes when title and branch tickets match case-insensitively", () => {
			const context = buildContext({ ticketId: "abc-123", title: "feat(auth): add auth | ABC-123" });
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(true);
		});
	});

	describe("combined violations", () => {
		it("reports all issues when multiple rules fail simultaneously", () => {
			const context = buildContext({
				body: "WIP body with no sections",
				ticketId: "XY-999",
				title: "bad title with TODO",
			});
			const result = useCase.execute(context, buildLintConfig(), buildTicketConfig());

			expect(result.isPassed).toBe(false);
			expect(result.issues.length).toBeGreaterThanOrEqual(3);

			const issueCodes = result.issues.map((issue: IPrLintIssue) => issue.code);

			expect(issueCodes).toContain(EPrLintIssueCode.TITLE_FORMAT);
			expect(issueCodes).toContain(EPrLintIssueCode.BODY_SECTIONS_ORDER);
			expect(issueCodes).toContain(EPrLintIssueCode.FORBIDDEN_PLACEHOLDER);
		});
	});

	describe("custom configuration", () => {
		it("accepts title matching a custom pattern", () => {
			const context = buildContext({ title: "AUTH-123: add authentication" });
			const config = buildLintConfig({ titlePattern: String.raw`^[A-Z]+-\d+: .+$` });
			const result = useCase.execute(context, config);

			expect(result.isPassed).toBe(true);
		});

		it("validates against custom required sections", () => {
			const customSections: Array<string> = ["Description", "Testing"];
			const body = "## Description\nSome description\n\n## Testing\nSome tests";
			const context = buildContext({ body });
			const config = buildLintConfig({ requiredSections: customSections });
			const result = useCase.execute(context, config);

			expect(result.isPassed).toBe(true);
		});

		it("validates against custom forbidden placeholders", () => {
			const context = buildContext({ title: "feat(auth): DRAFT add auth | ABC-123" });
			const config = buildLintConfig({ forbiddenPlaceholders: ["DRAFT"] });
			const result = useCase.execute(context, config);

			expect(result.isPassed).toBe(false);
			expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: EPrLintIssueCode.FORBIDDEN_PLACEHOLDER, details: expect.stringContaining("DRAFT") })]));
		});
	});

	describe("JSON output structure", () => {
		it("round-trips through JSON parse with correct types", () => {
			const result = useCase.execute(buildContext(), buildLintConfig(), buildTicketConfig());
			const json: string = JsonPresenter.presentLintResult(result);
			const parsed = JSON.parse(json) as IPrLintResult;

			expect(typeof parsed.isPassed).toBe("boolean");
			expect(Array.isArray(parsed.issues)).toBe(true);
		});

		it("serializes issue details with code and details fields", () => {
			const context = buildContext({ title: "bad title" });
			const result = useCase.execute(context, buildLintConfig());
			const json: string = JsonPresenter.presentLintResult(result);
			const parsed = JSON.parse(json) as IPrLintResult;

			for (const issue of parsed.issues) {
				expect(typeof issue.code).toBe("string");
				expect(typeof issue.details).toBe("string");
				expect(issue.details.length).toBeGreaterThan(0);
			}
		});

		it("uses issue codes that match EPrLintIssueCode enum values", () => {
			const context = buildContext({ body: "No sections", title: "bad title" });
			const result = useCase.execute(context, buildLintConfig());
			const json: string = JsonPresenter.presentLintResult(result);
			const parsed = JSON.parse(json) as IPrLintResult;
			const validCodes: Array<string> = Object.values(EPrLintIssueCode);

			for (const issue of parsed.issues) {
				expect(validCodes).toContain(issue.code);
			}
		});
	});

	describe("human-readable output", () => {
		it("shows passed indicator for a passing result", () => {
			const result = useCase.execute(buildContext(), buildLintConfig(), buildTicketConfig());
			const output: string = HumanPresenter.presentLintResult(result);

			expect(output).toContain("PR lint passed");
		});

		it("shows failed indicator with issue count for a failing result", () => {
			const context = buildContext({ title: "bad title" });
			const result = useCase.execute(context, buildLintConfig());
			const output: string = HumanPresenter.presentLintResult(result);

			expect(output).toContain("PR lint failed");
			expect(output).toContain("issue(s)");
		});

		it("includes issue code labels in failing output", () => {
			const context = buildContext({ title: "bad title" });
			const result = useCase.execute(context, buildLintConfig());
			const output: string = HumanPresenter.presentLintResult(result);

			expect(output).toContain(EPrLintIssueCode.TITLE_FORMAT);
		});
	});
});
