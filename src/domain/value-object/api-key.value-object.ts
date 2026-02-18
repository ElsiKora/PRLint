import { MIN_API_KEY_LENGTH, REDACTED_LENGTH, REDACTED_SEGMENTS_COUNT } from "../constant/numeric.constant";

/** Immutable value object representing an API key with validation and redaction. */
export class ApiKey {
	private readonly VALUE: string;

	constructor(value: string) {
		if (!value.trim()) {
			throw new Error("API key cannot be empty.");
		}

		this.VALUE = value.trim();
	}

	/**
	 * @param {ApiKey} other - The other API key to compare.
	 * @returns {boolean} Whether this API key is equal to another by value.
	 */
	public equals(other: ApiKey): boolean {
		return this.VALUE === other.VALUE;
	}

	/** @returns {string} The raw API key string. */
	public getValue(): string {
		return this.VALUE;
	}

	/** @returns {boolean} Whether the API key meets minimum length and is not a placeholder. */
	public isValid(): boolean {
		return this.VALUE.length > MIN_API_KEY_LENGTH && !this.VALUE.includes("your-api-key");
	}

	/** @returns {string} A redacted version of the API key for safe display. */
	public toRedacted(): string {
		if (this.VALUE.length <= REDACTED_LENGTH * REDACTED_SEGMENTS_COUNT) {
			return "****";
		}

		return `${this.VALUE.slice(0, REDACTED_LENGTH)}...${this.VALUE.slice(-REDACTED_LENGTH)}`;
	}
}
