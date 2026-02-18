import type { IFileSystemService } from "../../application/interface/file-system-service.interface";

import { access, readFile, writeFile } from "node:fs/promises";

/** File system operations backed by Node.js fs/promises. */
export class NodeFileSystemService implements IFileSystemService {
	/**
	 * @param {string} path - File path to check.
	 * @returns {Promise<boolean>} Whether the file exists.
	 */
	async exists(path: string): Promise<boolean> {
		try {
			await access(path);

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * @param {string} path - File path to read.
	 * @returns {Promise<string>} File contents as UTF-8 string.
	 */
	async readFile(path: string): Promise<string> {
		return readFile(path, "utf8");
	}

	/**
	 * @param {string} path - Destination path.
	 * @param {string} content - String content to write.
	 */
	async writeFile(path: string, content: string): Promise<void> {
		await writeFile(path, content, "utf8");
	}
}
