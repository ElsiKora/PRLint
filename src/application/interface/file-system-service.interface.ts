/** Abstraction for file system operations. */
export interface IFileSystemService {
	/** @param path - File path to check. @returns Whether the file exists. */
	exists(path: string): Promise<boolean>;

	/** @param path - File path to read. @returns The file contents as a UTF-8 string. */
	readFile(path: string): Promise<string>;

	/** @param path - Destination file path. @param content - String content to write. */
	writeFile(path: string, content: string): Promise<void>;
}
