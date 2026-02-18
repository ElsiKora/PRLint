import type { IBranchLintConfig } from "@/application/interface/branch-lint-config.interface";
import type { IBranchLintConfigService } from "@/application/interface/branch-lint-config-service.interface";
import type { IConfigService } from "@/application/interface/config-service.interface";
import { BranchTicketIdParser } from "@/infrastructure/git/branch-ticket-id-parser.service";
import { ETicketMissingBranchLintBehavior } from "@/domain/enum/ticket-missing-branch-lint-behavior.enum";
import { ETicketNormalization } from "@/domain/enum/ticket-normalization.enum";
import { ETicketSource } from "@/domain/enum/ticket-source.enum";
import type { ITicketConfig } from "@/domain/interface/ticket-config.interface";

function buildTicketConfig(overrides: Partial<ITicketConfig> = {}): ITicketConfig {
	return {
		missingBranchLintBehavior: ETicketMissingBranchLintBehavior.FALLBACK,
		normalization: ETicketNormalization.PRESERVE,
		pattern: "[A-Za-z]{2,}-\\d+",
		patternFlags: "i",
		source: ETicketSource.AUTO,
		...overrides,
	};
}

function buildBranchLintConfig(pattern: string = ":type/:ticket-:subject"): IBranchLintConfig {
	return {
		branches: ["feature", "bugfix", "release"],
		rules: {
			"branch-name-pattern": [2, "always", pattern],
			"branch-name-pattern-subject": [
				2,
				"always",
				{
					subject: "[a-z0-9-]+",
					ticket: "[a-z]{2,}-[0-9]+",
				},
			],
		},
	};
}

function createConfigService(ticketConfig: ITicketConfig): IConfigService {
	return {
		exists: vi.fn(),
		get: vi.fn().mockResolvedValue({
			ticket: ticketConfig,
		}),
		merge: vi.fn(),
		save: vi.fn(),
	} as unknown as IConfigService;
}

function createBranchLintConfigService(config: IBranchLintConfig | undefined): IBranchLintConfigService {
	return {
		load: vi.fn().mockResolvedValue(config),
	};
}

describe("BranchTicketIdParser", () => {
	it("extracts ticket from git-branch-lint pattern with optional placeholder", async () => {
		const parser = new BranchTicketIdParser(createConfigService(buildTicketConfig()), createBranchLintConfigService(buildBranchLintConfig()));

		const result = await parser.parse("feature/ab-123-add-login");

		expect(result?.getValue()).toBe("ab-123");
	});

	it("does not fallback to pattern when branch-lint is configured but optional ticket is absent", async () => {
		const parser = new BranchTicketIdParser(
			createConfigService(
				buildTicketConfig({
					pattern: "[a-z]+",
				}),
			),
			createBranchLintConfigService(buildBranchLintConfig()),
		);

		const result = await parser.parse("feature/refactor-auth-flow");

		expect(result).toBeUndefined();
	});

	it("falls back to regex pattern when source is branch-lint and config is missing", async () => {
		const parser = new BranchTicketIdParser(
			createConfigService(
				buildTicketConfig({
					source: ETicketSource.BRANCH_LINT,
				}),
			),
			createBranchLintConfigService(undefined),
		);

		const result = await parser.parse("feature/ab-321-fix");

		expect(result?.getValue()).toBe("ab-321");
	});

	it("throws when source is branch-lint, config is missing, and missing behavior is error", async () => {
		const parser = new BranchTicketIdParser(
			createConfigService(
				buildTicketConfig({
					missingBranchLintBehavior: ETicketMissingBranchLintBehavior.ERROR,
					source: ETicketSource.BRANCH_LINT,
				}),
			),
			createBranchLintConfigService(undefined),
		);

		await expect(parser.parse("feature/ab-321-fix")).rejects.toThrow(/no compatible git-branch-lint rule/i);
	});

	it("uses pattern fallback in auto mode when branch-name-pattern has no ticket placeholder", async () => {
		const parser = new BranchTicketIdParser(createConfigService(buildTicketConfig()), createBranchLintConfigService(buildBranchLintConfig(":type/:subject")));

		const result = await parser.parse("feature/ab-777-new-flow");

		expect(result?.getValue()).toBe("ab-777");
	});

	it("requires ticket match boundaries when using pattern source", async () => {
		const parser = new BranchTicketIdParser(
			createConfigService(
				buildTicketConfig({
					source: ETicketSource.PATTERN,
				}),
			),
			createBranchLintConfigService(undefined),
		);

		const invalid = await parser.parse("feature/ab-123x");
		const valid = await parser.parse("feature/ab-123-fix");

		expect(invalid).toBeUndefined();
		expect(valid?.getValue()).toBe("ab-123");
	});
});
