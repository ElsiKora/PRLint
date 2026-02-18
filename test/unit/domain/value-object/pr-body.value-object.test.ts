import { PrBody } from "@/domain/value-object/pr-body.value-object";

describe("PrBody", () => {
	it("creates with valid body", () => {
		const body = new PrBody("## Summary\nSome content");

		expect(body).toBeInstanceOf(PrBody);
		expect(body.getValue()).toBe("## Summary\nSome content");
	});

	it("allows empty body", () => {
		const body = new PrBody("");

		expect(body.getValue()).toBe("");
	});

	it("getValue returns the value", () => {
		const raw = "## Summary\nLine one\n## Changes\nLine two";
		const body = new PrBody(raw);

		expect(body.getValue()).toBe(raw);
	});
});
