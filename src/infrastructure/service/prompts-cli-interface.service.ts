/* eslint-disable @elsikora/sonar/no-duplicate-string,@elsikora/unicorn/no-process-exit */
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";

import type { ICliInterfaceServiceSelectOptions } from "../../application/interface/cli-interface-service-select-options.interface";
import type { ICliInterfaceService } from "../../application/interface/cli-interface-service.interface";

type TSpinner = {
	isSpinning?: boolean;
	start(): TSpinner;
	stop(): TSpinner;
	text: string;
};

/** Implementation of the CLI interface service using prompts. */
export class PromptsCliInterface implements ICliInterfaceService {
	private spinner: TSpinner;

	constructor() {
		this.spinner = ora();
	}

	clear(): void {
		process.stdout.write("\u001Bc");
	}

	async confirm(message: string, isConfirmedByDefault: boolean = false): Promise<boolean> {
		try {
			const response: prompts.Answers<string> = await prompts({
				active: "Yes",
				inactive: "No",
				initial: isConfirmedByDefault,
				message,
				name: "value",
				type: "toggle",
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.value as boolean;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	error(message: string): void {
		process.stderr.write(`${chalk.red(message)}\n`);
	}

	async groupMultiselect<T>(message: string, options: Record<string, Array<ICliInterfaceServiceSelectOptions>>, isRequired: boolean = false, initialValues?: Array<string>): Promise<Array<T>> {
		const choices: Array<{ selected: boolean; title: string; value: string }> = [];

		for (const [group, groupOptions] of Object.entries(options)) {
			for (const option of groupOptions) {
				choices.push({
					selected: initialValues?.includes(option.value) ?? false,
					title: `${group}: ${option.label}`,
					value: option.value,
				});
			}
		}

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				instructions: false,
				message: `${message} (space to select)`,
				min: isRequired ? 1 : undefined,
				name: "values",
				type: "multiselect",
			});

			if (response.values === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.values as Array<T>;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	handleError(message: string, error: unknown): void {
		process.stderr.write(`${chalk.red(message)}\n`);
		process.stderr.write(`${String(error)}\n`);
	}

	info(message: string): void {
		process.stdout.write(`${chalk.blue(message)}\n`);
	}

	log(message: string): void {
		process.stdout.write(`${message}\n`);
	}

	async multiselect<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, isRequired: boolean = false, initialValues?: Array<string>): Promise<Array<T>> {
		const choices: Array<{ selected: boolean; title: string; value: string }> = options.map(
			(option: ICliInterfaceServiceSelectOptions) => ({
				selected: initialValues?.includes(option.value) ?? false,
				title: option.label,
				value: option.value,
			}),
		);

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				instructions: false,
				message: `${message} (space to select)`,
				min: isRequired ? 1 : undefined,
				name: "values",
				type: "multiselect",
			});

			if (response.values === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.values as Array<T>;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	note(title: string, message: string): void {
		const lines: Array<string> = message.split("\n");
		const width: number = Math.max(title.length, ...lines.map((line: string) => line.length)) + 4;

		const top: string = `┌${"─".repeat(width)}┐`;
		const bottom: string = `└${"─".repeat(width)}┘`;
		const paddedTitle: string = ` ${title.padEnd(width - 2)} `;
		const paddedLines: Array<string> = lines.map((line: string) => ` ${line.padEnd(width - 2)} `);

		process.stdout.write(`${chalk.dim(top)}\n`);
		process.stdout.write(`${chalk.dim("│") + chalk.bold(paddedTitle) + chalk.dim("│")}\n`);

		if (lines.length > 0) {
			const separator: string = `├${"─".repeat(width)}┤`;
			process.stdout.write(`${chalk.dim(separator)}\n`);

			for (const line of paddedLines) {
				process.stdout.write(`${chalk.dim("│") + chalk.dim(line) + chalk.dim("│")}\n`);
			}
		}

		process.stdout.write(`${chalk.dim(bottom)}\n`);
	}

	async select<T>(message: string, options: Array<ICliInterfaceServiceSelectOptions>, initialValue?: string): Promise<T> {
		const choices: Array<{ title: string; value: string }> = options.map((option: ICliInterfaceServiceSelectOptions) => ({
			title: option.label,
			value: option.value,
		}));

		const initialIndex: number | undefined = initialValue ? choices.findIndex((choice: { title: string; value: string }) => choice.value === initialValue) : undefined;

		try {
			const response: prompts.Answers<string> = await prompts({
				choices,
				initial: initialIndex === -1 ? 0 : initialIndex,
				message,
				name: "value",
				type: "select",
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.value as T;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	startSpinner(message: string): void {
		this.spinner.stop();
		this.spinner = ora(message).start();
	}

	stopSpinner(message?: string): void {
		this.spinner.stop();

		if (message) {
			process.stdout.write(`${message}\n`);
		}
	}

	success(message: string): void {
		process.stdout.write(`${chalk.green(message)}\n`);
	}

	async text(message: string, _placeholder?: string, initialValue?: string, validate?: (value: string) => Error | string | undefined): Promise<string> {
		const promptsValidate: ((value: string) => boolean | string) | undefined = validate
			? (value: string) => {
					const result: Error | string | undefined = validate(value);

					if (result === undefined) {
						return true;
					}

					if (typeof result === "string") {
						return result;
					}

					if (result instanceof Error) {
						return result.message;
					}

					return "Invalid input";
				}
			: undefined;

		try {
			const response: prompts.Answers<string> = await prompts({
				initial: initialValue,
				message,
				name: "value",
				type: "text",
				validate: promptsValidate,
			});

			if (response.value === undefined) {
				this.error("Operation cancelled by user");
				process.exit(0);
			}

			return response.value as string;
		} catch {
			this.error("Operation cancelled by user");
			process.exit(0);
		}
	}

	updateSpinner(message: string): void {
		if (this.spinner?.isSpinning) {
			this.spinner.text = message;
		}
	}

	warn(message: string): void {
		process.stdout.write(`${chalk.yellow(message)}\n`);
	}
}
