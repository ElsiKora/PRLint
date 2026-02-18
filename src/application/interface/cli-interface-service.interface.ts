import type { ICliInterfaceServiceSelectOptions } from "./cli-interface-service-select-options.interface";

/** Abstraction for CLI user interaction (prompts, spinners, output). */
export interface ICliInterfaceService {
	/** Clears the terminal screen. */
	clear(): void;

	/** Prompts the user for a yes/no confirmation. */
	confirm(message: string, isConfirmedByDefault?: boolean): Promise<boolean>;

	/** Displays an error message. */
	error(message: string): void;

	/** Prompts the user to choose multiple options grouped by category. */
	groupMultiselect<T>(
		message: string,
		options: Record<string, Array<ICliInterfaceServiceSelectOptions>>,
		isRequired?: boolean,
		initialValue?: Array<string>,
	): Promise<Array<T>>;

	/** Displays an error message with contextual error details. */
	handleError(message: string, error: unknown): void;

	/** Displays an informational message. */
	info(message: string): void;

	/** Displays a plain log message. */
	log(message: string): void;

	/** Displays a boxed note with a title and body. */
	note(title: string, message: string): void;

	/** Prompts the user to choose multiple options. */
	multiselect<T>(
		message: string,
		options: Array<ICliInterfaceServiceSelectOptions>,
		isRequired?: boolean,
		initialValue?: Array<string>,
	): Promise<Array<T>>;

	/** Prompts the user to select from a list of options. */
	select<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, initialValue?: string): Promise<T>;

	/** Starts a spinner with the given message. */
	startSpinner(message: string): void;

	/** Stops the active spinner with an optional completion message. */
	stopSpinner(message?: string): void;

	/** Displays a success message. */
	success(message: string): void;

	/** Prompts the user for free-text input. */
	text(
		message: string,
		placeholder?: string,
		initialValue?: string,
		validate?: (value: string) => Error | string | undefined,
	): Promise<string>;

	/** Updates the message on the currently active spinner. */
	updateSpinner(message: string): void;

	/** Displays a warning message. */
	warn(message: string): void;
}
