import type { IPrLintIssue } from "./pr-lint-issue.interface";

export interface IPrLintResult {
	issues: Array<IPrLintIssue>;
	pass: boolean;
}
