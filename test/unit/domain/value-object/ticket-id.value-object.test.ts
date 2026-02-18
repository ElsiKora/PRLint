import { ETicketNormalization } from "@/domain/enum/ticket-normalization.enum";
import { TicketId } from "@/domain/value-object/ticket-id.value-object";

describe("TicketId", () => {
	it("preserves case with PRESERVE normalization", () => {
		const ticket = new TicketId("AbC-123", ETicketNormalization.PRESERVE);

		expect(ticket.getValue()).toBe("AbC-123");
	});

	it("lowercases with LOWER normalization", () => {
		const ticket = new TicketId("ABC-123", ETicketNormalization.LOWER);

		expect(ticket.getValue()).toBe("abc-123");
	});

	it("uppercases with UPPER normalization", () => {
		const ticket = new TicketId("abc-123", ETicketNormalization.UPPER);

		expect(ticket.getValue()).toBe("ABC-123");
	});

	it("stores empty string without throwing", () => {
		const ticket = new TicketId("", ETicketNormalization.PRESERVE);

		expect(ticket.getValue()).toBe("");
	});
});
