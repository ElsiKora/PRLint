/** Immutable value object wrapping a pull request body. */
export class PrBody {
	private readonly VALUE: string;

	constructor(value: string) {
		this.VALUE = value.trim();
	}

	/** Returns the trimmed body text. */
	public getValue(): string {
		return this.VALUE;
	}
}
