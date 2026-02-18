/** Abstraction for executing shell commands. */
export interface ICommandService {
	/** @param command - Shell command string to execute. @returns Trimmed stdout output. */
	execute(command: string): Promise<string>;
}
