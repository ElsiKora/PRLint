import { ETicketNormalization } from "../enum/ticket-normalization.enum";

/** Immutable value object representing a normalized ticket identifier. */
export class TicketId {
	private readonly VALUE: string;

	constructor(value: string, normalization: ETicketNormalization) {
		switch (normalization) {
			case ETicketNormalization.LOWER: {
				this.VALUE = value.toLowerCase();

				break;
			}

			case ETicketNormalization.PRESERVE: {
				this.VALUE = value;

				break;
			}

			case ETicketNormalization.UPPER: {
				this.VALUE = value.toUpperCase();

				break;
			}
		}
	}

	/** @returns {string} The normalized ticket identifier string. */
	public getValue(): string {
		return this.VALUE;
	}
}
