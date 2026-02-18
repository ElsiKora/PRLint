import type { IPrLintIssue } from "./pr-lint-issue.interface";

export interface IPrLintResult {
	isPassed: boolean;
	issues: Array<IPrLintIssue>;
}
