import type { ICliInterfaceService } from "@/application/interface/cli-interface-service.interface";
import { EPrTemplateType } from "@/domain/enum/pr-template-type.enum";
import { resolvePrTemplateType } from "@/presentation/cli/helper/resolve-pr-template-type.function";

function createCliInterface(selectedTemplateType: EPrTemplateType): ICliInterfaceService {
	return {
		clear: vi.fn(),
		confirm: vi.fn(),
		error: vi.fn(),
		groupMultiselect: vi.fn(),
		handleError: vi.fn(),
		info: vi.fn(),
		log: vi.fn(),
		multiselect: vi.fn(),
		note: vi.fn(),
		select: vi.fn().mockResolvedValue(selectedTemplateType),
		startSpinner: vi.fn(),
		stopSpinner: vi.fn(),
		success: vi.fn(),
		text: vi.fn(),
		updateSpinner: vi.fn(),
		warn: vi.fn(),
	};
}

describe("resolvePrTemplateType", () => {
	it("returns inferred default in json mode without prompting", async () => {
		const cliInterface = createCliInterface(EPrTemplateType.RELEASE);
		const result = await resolvePrTemplateType("bugfix/abc-123-fix-parser", true, cliInterface);

		expect(result).toBe(EPrTemplateType.BUGFIX);
		expect(cliInterface.select).not.toHaveBeenCalled();
	});

	it("prompts in interactive mode and passes inferred default", async () => {
		const cliInterface = createCliInterface(EPrTemplateType.RELEASE);
		const result = await resolvePrTemplateType("feature/abc-123-new-flow", false, cliInterface);

		expect(result).toBe(EPrTemplateType.RELEASE);
		expect(cliInterface.select).toHaveBeenCalledWith("Select PR template type:", expect.any(Array), EPrTemplateType.FEATURE);
	});

	it("infers release template from release branches", async () => {
		const cliInterface = createCliInterface(EPrTemplateType.RELEASE);
		const result = await resolvePrTemplateType("release/1.2.3", true, cliInterface);

		expect(result).toBe(EPrTemplateType.RELEASE);
	});
});
