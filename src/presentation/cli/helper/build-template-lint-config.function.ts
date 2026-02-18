import type { EPrTemplateType } from "../../../domain/enum/pr-template-type.enum";
import type { IPrLintConfig } from "../../../domain/interface/pr-lint-config.interface";

import { PR_TEMPLATE_REQUIRED_SECTIONS } from "../../../domain/constant/pr-template-required-sections.constant";

/**
 * Builds a template-specific lint configuration by merging required sections.
 * @param {IPrLintConfig} lintConfig - Base lint configuration to extend.
 * @param {EPrTemplateType} templateType - PR template type determining required sections.
 * @returns {IPrLintConfig} Lint configuration with template-specific required sections.
 */
export function buildTemplateLintConfig(lintConfig: IPrLintConfig, templateType: EPrTemplateType): IPrLintConfig {
	return {
		...lintConfig,
		requiredSections: [...PR_TEMPLATE_REQUIRED_SECTIONS[templateType]],
	};
}
