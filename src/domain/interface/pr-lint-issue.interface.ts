import type { EPrLintIssueCode } from "../enum/pr-lint-issue-code.enum";

export interface IPrLintIssue {
	code: EPrLintIssueCode;
	details: string;
}
