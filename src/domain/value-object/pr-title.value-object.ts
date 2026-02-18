export class PrTitle {
	private readonly VALUE: string;

	constructor(value: string) {
		const normalizedValue: string = value.trim();

		if (!normalizedValue) {
			throw new Error("PR title cannot be empty");
		}

		this.VALUE = normalizedValue;
	}

	public getValue(): string {
		return this.VALUE;
	}
}
