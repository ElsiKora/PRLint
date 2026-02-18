import type { ICliInterfaceServiceSelectOptions } from "../../../application/interface/cli-interface-service-select-options.interface";
import type { ICliInterfaceService } from "../../../application/interface/cli-interface-service.interface";

import { EPrTemplateType } from "../../../domain/enum/pr-template-type.enum";

const PR_TEMPLATE_SELECT_OPTIONS: ReadonlyArray<ICliInterfaceServiceSelectOptions> = [
	{ label: "Bugfix / Hotfix (bugfix-pr-v1)", value: EPrTemplateType.BUGFIX },
	{ label: "Feature (feature-pr-v1)", value: EPrTemplateType.FEATURE },
	{ label: "Release / Support (release-pr-v1)", value: EPrTemplateType.RELEASE },
];

/**
 * Resolves the PR template type from the branch name, prompting the user if not in JSON mode.
 * @param {string} branchName - Current git branch name used to infer template type.
 * @param {boolean} isJsonOutput - Whether output is JSON (skips interactive prompt).
 * @param {ICliInterfaceService} cliInterface - CLI interface for interactive template selection.
 * @returns {Promise<EPrTemplateType>} The resolved PR template type.
 */
export async function resolvePrTemplateType(branchName: string, isJsonOutput: boolean, cliInterface: ICliInterfaceService): Promise<EPrTemplateType> {
	const defaultTemplateType: EPrTemplateType = inferPrTemplateTypeFromBranch(branchName);

	if (isJsonOutput) {
		return defaultTemplateType;
	}

	return cliInterface.select<EPrTemplateType>("Select PR template type:", [...PR_TEMPLATE_SELECT_OPTIONS], defaultTemplateType);
}

/**
 * Infers the PR template type from the branch name prefix.
 * @param {string} branchName - Git branch name to analyze.
 * @returns {EPrTemplateType} The inferred template type based on branch prefix.
 */
function inferPrTemplateTypeFromBranch(branchName: string): EPrTemplateType {
	const branchPrefix: string = branchName.split("/")[0]?.toLowerCase() ?? "";

	if (branchPrefix === "bugfix" || branchPrefix === "hotfix" || branchPrefix === "fix") {
		return EPrTemplateType.BUGFIX;
	}

	if (branchPrefix === "release" || branchPrefix === "support") {
		return EPrTemplateType.RELEASE;
	}

	return EPrTemplateType.FEATURE;
}
