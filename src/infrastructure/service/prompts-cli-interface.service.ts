import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";

import type { ICliInterfaceServiceSelectOptions } from "../../application/interface/cli-interface-service-select-options.interface";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface";

/** CLI interface implementation backed by prompts, chalk, and ora. */
export class PromptsCliInterface implements ICliInterfaceService {
	private spinner = ora();

	/** Clears the terminal screen. */
	clear(): void {
		console.clear();
	}

	/** @param message - Confirmation prompt message. @param isConfirmedByDefault - Default boolean value. @returns User's boolean response. */
	async confirm(message: string, isConfirmedByDefault?: boolean): Promise<boolean> {
		const response = await prompts({
			active: "Yes",
			inactive: "No",
			initial: isConfirmedByDefault ?? false,
			message,
			name: "value",
			type: "toggle",
		});

		if (response.value === undefined) {
			process.exit(0);
		}

		return response.value as boolean;
	}

	/** @param message - Error message to display. */
	error(message: string): void {
		process.stderr.write(chalk.red("✖ ") + message + "\n");
	}

	/** @param message - Error context message. @param error - Error to handle and display. */
	handleError(message: string, error: unknown): void {
		this.error(message);
		this.log(String(error));
	}

	/** @param message - Informational message to display. */
	info(message: string): void {
		process.stdout.write(chalk.blue("ℹ ") + message + "\n");
	}

	/** @param message - Message to log to stdout. */
	log(message: string): void {
		process.stdout.write(message + "\n");
	}

	/** @param title - Note title. @param message - Note body content. */
	note(title: string, message: string): void {
		const lines = message.split("\n");
		const contentWidth = Math.max(title.length + 2, ...lines.map((l) => l.length));
		const boxWidth = contentWidth + 3;
		const dashes = contentWidth - title.length;

		const top = chalk.dim("┌─") + chalk.bold(` ${title} `) + chalk.dim("─".repeat(dashes) + "┐");
		const empty = chalk.dim("│") + " ".repeat(boxWidth) + chalk.dim("│");
		const bottom = chalk.dim("└" + "─".repeat(boxWidth) + "┘");

		process.stdout.write(top + "\n");
		process.stdout.write(empty + "\n");

		for (const line of lines) {
			const padding = " ".repeat(contentWidth - line.length);
			process.stdout.write(chalk.dim("│") + "  " + line + padding + " " + chalk.dim("│") + "\n");
		}

		process.stdout.write(empty + "\n");
		process.stdout.write(bottom + "\n");
	}

	/** @param message - Select prompt message. @param options - Available options. @param initialValue - Default selection value. @returns Selected value. */
	async select<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, initialValue?: string): Promise<T> {
		const initialIndex = initialValue !== undefined ? options.findIndex((o) => o.value === initialValue) : undefined;

		const response = await prompts({
			choices: options.map((o) => ({ title: o.label, value: o.value })),
			initial: initialIndex !== undefined && initialIndex >= 0 ? initialIndex : 0,
			message,
			name: "value",
			type: "select",
		});

		if (response.value === undefined) {
			return process.exit(0);
		}

		return response.value as unknown as T;
	}

	/** @param message - Spinner start message. */
	startSpinner(message: string): void {
		this.spinner = ora(message).start();
	}

	/** @param message - Optional final success message. */
	stopSpinner(message?: string): void {
		if (message) {
			this.spinner.succeed(message);
		} else {
			this.spinner.stop();
		}
	}

	/** @param message - Success message to display. */
	success(message: string): void {
		process.stdout.write(chalk.green("✔ ") + message + "\n");
	}

	/** @param message - Prompt message. @param _placeholder - Placeholder text hint (unused by prompts adapter). @param initialValue - Default text value. @param validate - Validation function returning Error, string, or undefined. @returns User's text input. */
	async text(message: string, _placeholder?: string, initialValue?: string, validate?: (value: string) => Error | string | undefined): Promise<string> {
		const adaptedValidate = validate
			? (value: string): boolean | string => {
					const result = validate(value);
					if (result === undefined) return true;
					if (result instanceof Error) return result.message;

					return result;
				}
			: undefined;

		const response = await prompts({
			initial: initialValue,
			message,
			name: "value",
			type: "text",
			validate: adaptedValidate,
		});

		if (response.value === undefined) {
			process.exit(0);
		}

		return response.value as string;
	}

	/** @param message - Updated spinner text. */
	updateSpinner(message: string): void {
		this.spinner.text = message;
	}

	/** @param message - Warning message to display. */
	warn(message: string): void {
		process.stdout.write(chalk.yellow("⚠ ") + message + "\n");
	}
}
