import { PrTitle } from "@/domain/value-object/pr-title.value-object";

describe("PrTitle", () => {
	it("creates with valid string", () => {
		const title = new PrTitle("feat(core): add parser | ABC-123");

		expect(title).toBeInstanceOf(PrTitle);
	});

	it("trims whitespace", () => {
		const title = new PrTitle("  feat(core): add parser  ");

		expect(title.getValue()).toBe("feat(core): add parser");
	});

	it("throws on empty string", () => {
		expect(() => new PrTitle("")).toThrow("PR title cannot be empty");
		expect(() => new PrTitle("   ")).toThrow("PR title cannot be empty");
	});

	it("getValue returns the value", () => {
		const raw = "fix(api): resolve timeout | XY-42";
		const title = new PrTitle(raw);

		expect(title.getValue()).toBe(raw);
	});
});
