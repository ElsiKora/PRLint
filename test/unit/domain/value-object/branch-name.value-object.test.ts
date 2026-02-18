import { BranchName } from "@/domain/value-object/branch-name.value-object";

describe("BranchName", () => {
	it("creates with valid name", () => {
		const branch = new BranchName("feature/ABC-123-add-login");

		expect(branch).toBeInstanceOf(BranchName);
	});

	it("throws on empty string", () => {
		expect(() => new BranchName("")).toThrow("Branch name cannot be empty");
		expect(() => new BranchName("   ")).toThrow("Branch name cannot be empty");
	});

	it("getValue returns the value", () => {
		const raw = "fix/XY-42-resolve-timeout";
		const branch = new BranchName(raw);

		expect(branch.getValue()).toBe(raw);
	});
});
