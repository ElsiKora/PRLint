import { EPrTemplateType } from "../enum/pr-template-type.enum";

export const PR_TEMPLATE_REQUIRED_SECTIONS: Readonly<Record<EPrTemplateType, ReadonlyArray<string>>> = {
	[EPrTemplateType.BUGFIX]: ["Summary", "Root Cause", "Changes", "Acceptance Criteria", "Test Plan", "Risks & Rollback", "Linear"],
	[EPrTemplateType.FEATURE]: ["Summary", "Scope", "Implementation", "Acceptance Criteria", "Test Plan", "Rollout", "Linear"],
	[EPrTemplateType.RELEASE]: ["Release Scope", "Included Changes", "Breaking Changes", "Migrations", "Verification", "Rollback", "Linear"],
};
