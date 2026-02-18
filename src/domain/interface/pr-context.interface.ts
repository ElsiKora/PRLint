import type { EPrTemplateType } from "../enum/pr-template-type.enum";

export interface IPrContext {
	body: string;
	branch: string;
	diff: string;
	files: Array<string>;
	requiredSections?: ReadonlyArray<string>;
	templateType?: EPrTemplateType;
	ticketId?: string;
	title: string;
}
