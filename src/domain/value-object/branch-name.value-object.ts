/** Immutable value object wrapping a git branch name. */
export class BranchName {
	private readonly VALUE: string;

	constructor(value: string) {
		const normalizedValue: string = value.trim();

		if (!normalizedValue) {
			throw new Error("Branch name cannot be empty");
		}

		this.VALUE = normalizedValue;
	}

	/** @returns {string} The branch name string. */
	public getValue(): string {
		return this.VALUE;
	}
}
