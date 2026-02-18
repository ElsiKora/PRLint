import type { IBranchLintConfigService } from "../../application/interface/branch-lint-config-service.interface";
import type { IBranchLintConfig } from "../../application/interface/branch-lint-config.interface";
import type { IConfigService } from "../../application/interface/config-service.interface";
import type { ITicketIdParser } from "../../application/interface/ticket-id-parser.interface";
import type { ITicketConfig } from "../../domain/interface/ticket-config.interface";

import { MIN_RULE_PAYLOAD_LENGTH, RULE_VALUE_INDEX } from "../../domain/constant/numeric.constant";
import { BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE, DEFAULT_TICKET_MISSING_BRANCH_LINT_BEHAVIOR, DEFAULT_TICKET_NORMALIZATION, DEFAULT_TICKET_PATTERN_FLAGS, DEFAULT_TICKET_PATTERN_SOURCE, DEFAULT_TICKET_SOURCE } from "../../domain/constant/ticket.constant";
import { ETicketMissingBranchLintBehavior } from "../../domain/enum/ticket-missing-branch-lint-behavior.enum";
import { ETicketNormalization } from "../../domain/enum/ticket-normalization.enum";
import { ETicketSource } from "../../domain/enum/ticket-source.enum";
import { TicketId } from "../../domain/value-object/ticket-id.value-object";

const ALPHANUMERIC_PATTERN: RegExp = /[A-Za-z0-9]/u;
const ALLOWED_REGEX_FLAGS: Set<string> = new Set<string>(["d", "g", "i", "m", "s", "u", "v", "y"]);
const PLACEHOLDER_PATTERN: RegExp = /:([a-z][a-z0-9-]*)/giu;
const TRAILING_HYPHEN_PATTERN: RegExp = /-$/u;

type TSubjectPatternSource = Record<string, string> | string | undefined;

/** Extracts a ticket identifier from a branch name using configurable strategies. */
export class BranchTicketIdParser implements ITicketIdParser {
	private readonly BRANCH_LINT_CONFIG_SERVICE: IBranchLintConfigService;

	private readonly CONFIG_SERVICE: IConfigService;

	constructor(configService: IConfigService, branchLintConfigService: IBranchLintConfigService) {
		this.CONFIG_SERVICE = configService;
		this.BRANCH_LINT_CONFIG_SERVICE = branchLintConfigService;
	}

	/**
	 * @param {string} branchName - Git branch name to parse.
	 * @returns {Promise<TicketId | undefined>} Parsed ticket ID or undefined.
	 */
	async parse(branchName: string): Promise<TicketId | undefined> {
		const config: Awaited<ReturnType<IConfigService["get"]>> = await this.CONFIG_SERVICE.get();
		const ticketConfig: ITicketConfig = this.resolveTicketConfig(config.ticket);

		switch (ticketConfig.source) {
			case ETicketSource.AUTO: {
				const branchLintMatch: { isConfigured: boolean; ticketId: TicketId | undefined } = await this.fromBranchLint(branchName, ticketConfig);

				if (branchLintMatch.isConfigured) {
					return branchLintMatch.ticketId;
				}

				return this.fromPattern(branchName, ticketConfig);
			}

			case ETicketSource.BRANCH_LINT: {
				const branchLintMatch: { isConfigured: boolean; ticketId: TicketId | undefined } = await this.fromBranchLint(branchName, ticketConfig);

				if (!branchLintMatch.isConfigured) {
					if (ticketConfig.missingBranchLintBehavior === ETicketMissingBranchLintBehavior.ERROR) {
						throw new Error(['ticket.source is "branch-lint" but no compatible git-branch-lint rule was found.', 'Expected rules["branch-name-pattern"] with a :ticket placeholder.'].join(" "));
					}

					return this.fromPattern(branchName, ticketConfig);
				}

				return branchLintMatch.ticketId;
			}

			case ETicketSource.NONE: {
				return undefined;
			}

			case ETicketSource.PATTERN: {
				return this.fromPattern(branchName, ticketConfig);
			}
		}
	}

	private buildPatternVariants(branchPatternSource: string): Array<string> {
		if (!branchPatternSource.includes(":ticket-")) {
			return [branchPatternSource];
		}

		return [branchPatternSource, branchPatternSource.replace(":ticket-", "")];
	}

	private ensureGlobalFlag(flags: string): string {
		return flags.includes("g") ? flags : `${flags}g`;
	}

	private escapeRegex(value: string): string {
		return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
	}

	private extractDelimitedMatch(value: string, patternSource: string, patternFlags: string): string | undefined {
		const normalizedFlags: string = this.ensureGlobalFlag(this.normalizeRegexFlags(patternFlags));
		const matcher: RegExp = new RegExp(patternSource, normalizedFlags);

		for (const match of value.matchAll(matcher)) {
			const matchedValue: string | undefined = match[0];
			const matchIndex: number = match.index ?? -1;

			if (!matchedValue || matchIndex < 0) {
				continue;
			}

			const previousSymbol: string = matchIndex > 0 ? (value[matchIndex - 1] ?? "") : "";
			const nextIndex: number = matchIndex + matchedValue.length;
			const nextSymbol: string = nextIndex < value.length ? (value[nextIndex] ?? "") : "";

			if (this.isBoundary(previousSymbol) && this.isBoundary(nextSymbol)) {
				return matchedValue;
			}
		}

		return undefined;
	}

	private extractPlaceholders(branchPatternSource: string): Array<{ endIndex: number; groupName: string; index: number }> {
		const placeholders: Array<{ endIndex: number; groupName: string; index: number }> = [];

		for (const match of branchPatternSource.matchAll(PLACEHOLDER_PATTERN)) {
			const placeholderName: string | undefined = match[1];
			const matchIndex: number = match.index ?? -1;

			if (!placeholderName || matchIndex < 0) {
				continue;
			}

			const normalizedPlaceholder: string = placeholderName.replace(TRAILING_HYPHEN_PATTERN, "");

			placeholders.push({
				endIndex: matchIndex + match[0].length,
				groupName: normalizedPlaceholder,
				index: matchIndex,
			});
		}

		return placeholders;
	}

	private extractRuleValue(rulePayload: unknown): unknown {
		if (!Array.isArray(rulePayload) || rulePayload.length < MIN_RULE_PAYLOAD_LENGTH) {
			return undefined;
		}

		return rulePayload[RULE_VALUE_INDEX];
	}

	private async fromBranchLint(branchName: string, ticketConfig: ITicketConfig): Promise<{ isConfigured: boolean; ticketId: TicketId | undefined }> {
		const branchLintConfig: IBranchLintConfig | undefined = await this.BRANCH_LINT_CONFIG_SERVICE.load();
		const branchPatternSource: string | undefined = this.resolveBranchNamePatternSource(branchLintConfig);

		if (!branchPatternSource?.includes(":ticket")) {
			return { isConfigured: false, ticketId: undefined };
		}

		const subjectPatternSource: TSubjectPatternSource = this.resolveBranchSubjectPatternSource(branchLintConfig);
		const patternVariants: Array<string> = this.buildPatternVariants(branchPatternSource);

		for (const patternVariant of patternVariants) {
			const match: null | RegExpExecArray = this.matchBranchPattern(branchName, patternVariant, branchLintConfig, subjectPatternSource, ticketConfig);

			if (!match) {
				continue;
			}

			const ticketCandidate: string | undefined = match.groups?.ticket;

			if (!ticketCandidate) {
				return { isConfigured: true, ticketId: undefined };
			}

			return {
				isConfigured: true,
				ticketId: new TicketId(ticketCandidate, ticketConfig.normalization),
			};
		}

		return { isConfigured: true, ticketId: undefined };
	}

	private fromPattern(branchName: string, ticketConfig: ITicketConfig): TicketId | undefined {
		const matchedTicket: string | undefined = this.extractDelimitedMatch(branchName, ticketConfig.pattern, ticketConfig.patternFlags);

		if (!matchedTicket) {
			return undefined;
		}

		return new TicketId(matchedTicket, ticketConfig.normalization);
	}

	private getRulePayload(branchLintConfig: IBranchLintConfig | undefined, ruleName: string): unknown {
		const rules: Record<string, unknown> | undefined = branchLintConfig?.rules;

		if (!rules || typeof rules !== "object") {
			return undefined;
		}

		return rules[ruleName];
	}

	private isBoundary(symbol: string): boolean {
		return symbol.length === 0 || !ALPHANUMERIC_PATTERN.test(symbol);
	}

	private matchBranchPattern(branchName: string, branchPatternSource: string, branchLintConfig: IBranchLintConfig | undefined, subjectPatternSource: TSubjectPatternSource, ticketConfig: ITicketConfig): null | RegExpExecArray {
		const placeholders: Array<{ endIndex: number; groupName: string; index: number }> = this.extractPlaceholders(branchPatternSource);
		let regexSource: string = "";
		let previousIndex: number = 0;

		for (const placeholderData of placeholders) {
			regexSource += this.escapeRegex(branchPatternSource.slice(previousIndex, placeholderData.index));
			regexSource += `(?<${placeholderData.groupName}>${this.resolvePlaceholderPatternSource(placeholderData.groupName, branchLintConfig, subjectPatternSource, ticketConfig.pattern)})`;
			previousIndex = placeholderData.endIndex;
		}

		regexSource += this.escapeRegex(branchPatternSource.slice(previousIndex));
		const matcher: RegExp = new RegExp(`^${regexSource}$`, "u");

		return matcher.exec(branchName);
	}

	private normalizeRegexFlags(patternFlags: string): string {
		const flagCharacters: Array<string> = patternFlags.match(/./gu) ?? [];
		const distinctFlags: Array<string> = [...new Set<string>(flagCharacters)];

		return distinctFlags.filter((flag: string) => ALLOWED_REGEX_FLAGS.has(flag)).join("");
	}

	private resolveBranchNamePatternSource(branchLintConfig: IBranchLintConfig | undefined): string | undefined {
		const rulePayload: unknown = this.getRulePayload(branchLintConfig, "branch-name-pattern");
		const ruleValue: unknown = this.extractRuleValue(rulePayload);

		if (typeof ruleValue === "string" && ruleValue.trim().length > 0) {
			return ruleValue;
		}

		const legacyPattern: unknown = (branchLintConfig as Record<string, unknown> | undefined)?.pattern;

		if (typeof legacyPattern === "string" && legacyPattern.trim().length > 0) {
			return legacyPattern;
		}

		return undefined;
	}

	// eslint-disable-next-line @elsikora/sonar/function-return-type
	private resolveBranchSubjectPatternSource(branchLintConfig: IBranchLintConfig | undefined): TSubjectPatternSource {
		const rulePayload: unknown = this.getRulePayload(branchLintConfig, "branch-name-pattern-subject");
		const ruleValue: unknown = this.extractRuleValue(rulePayload);

		let result: TSubjectPatternSource;

		if (typeof ruleValue === "string") {
			result = ruleValue;
		} else if (ruleValue && typeof ruleValue === "object") {
			const normalizedEntries: Array<readonly [string, string]> = Object.entries(ruleValue as Record<string, unknown>)
				.filter(([, entryValue]: [string, unknown]) => typeof entryValue === "string")
				.map(([entryKey, entryValue]: [string, unknown]) => [entryKey, entryValue as string] as const);

			result = normalizedEntries.length > 0 ? Object.fromEntries(normalizedEntries) : undefined;
		}

		return result;
	}

	private resolveMissingBranchLintBehavior(behavior: ETicketMissingBranchLintBehavior): ETicketMissingBranchLintBehavior {
		if (behavior === ETicketMissingBranchLintBehavior.ERROR || behavior === ETicketMissingBranchLintBehavior.FALLBACK) {
			return behavior;
		}

		return DEFAULT_TICKET_MISSING_BRANCH_LINT_BEHAVIOR as ETicketMissingBranchLintBehavior;
	}

	private resolvePlaceholderPatternSource(placeholderName: string, branchLintConfig: IBranchLintConfig | undefined, subjectPatternSource: TSubjectPatternSource, fallbackTicketPatternSource: string): string {
		if (placeholderName === "type") {
			return this.resolveTypePatternSource(branchLintConfig);
		}

		if (placeholderName === "ticket") {
			return this.resolveTicketPatternSource(subjectPatternSource, fallbackTicketPatternSource);
		}

		return this.resolveSubjectPatternSource(subjectPatternSource, placeholderName);
	}

	private resolveSubjectPatternSource(subjectPatternSource: TSubjectPatternSource, placeholderName: string): string {
		if (!subjectPatternSource) {
			return BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE;
		}

		if (typeof subjectPatternSource === "string") {
			return subjectPatternSource;
		}

		return subjectPatternSource[placeholderName] ?? BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE;
	}

	private resolveTicketConfig(ticketConfig: ITicketConfig): ITicketConfig {
		return {
			missingBranchLintBehavior: this.resolveMissingBranchLintBehavior(ticketConfig.missingBranchLintBehavior),
			normalization: this.resolveTicketNormalization(ticketConfig.normalization),
			pattern: ticketConfig.pattern || DEFAULT_TICKET_PATTERN_SOURCE,
			patternFlags: this.normalizeRegexFlags(ticketConfig.patternFlags || DEFAULT_TICKET_PATTERN_FLAGS),
			source: this.resolveTicketSource(ticketConfig.source),
		};
	}

	private resolveTicketNormalization(normalization: ETicketNormalization): ETicketNormalization {
		if (normalization === ETicketNormalization.LOWER || normalization === ETicketNormalization.PRESERVE || normalization === ETicketNormalization.UPPER) {
			return normalization;
		}

		return DEFAULT_TICKET_NORMALIZATION as ETicketNormalization;
	}

	private resolveTicketPatternSource(subjectPatternSource: TSubjectPatternSource, fallbackTicketPatternSource: string): string {
		if (!subjectPatternSource) {
			return fallbackTicketPatternSource;
		}

		if (typeof subjectPatternSource === "string") {
			return fallbackTicketPatternSource;
		}

		return subjectPatternSource.ticket ?? fallbackTicketPatternSource;
	}

	private resolveTicketSource(source: ETicketSource): ETicketSource {
		if (source === ETicketSource.AUTO || source === ETicketSource.BRANCH_LINT || source === ETicketSource.NONE || source === ETicketSource.PATTERN) {
			return source;
		}

		return DEFAULT_TICKET_SOURCE as ETicketSource;
	}

	private resolveTypePatternSource(branchLintConfig: IBranchLintConfig | undefined): string {
		const branches: unknown = branchLintConfig?.branches;

		if (Array.isArray(branches) && branches.length > 0) {
			return branches.map((branchType: string) => this.escapeRegex(branchType)).join("|");
		}

		if (branches && typeof branches === "object") {
			const branchKeys: Array<string> = Object.keys(branches);

			if (branchKeys.length > 0) {
				return branchKeys.map((branchType: string) => this.escapeRegex(branchType)).join("|");
			}
		}

		return BRANCH_LINT_DEFAULT_SUBJECT_PATTERN_SOURCE;
	}
}
