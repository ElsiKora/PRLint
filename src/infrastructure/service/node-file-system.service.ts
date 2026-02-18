import { access, readFile, writeFile } from "node:fs/promises";

import type { IFileSystemService } from "../../application/interface/file-system-service.interface";

/** File system operations backed by Node.js fs/promises. */
export class NodeFileSystemService implements IFileSystemService {
	/** @param path - File path to check. @returns Whether the file exists. */
	async exists(path: string): Promise<boolean> {
		try {
			await access(path);

			return true;
		} catch {
			return false;
		}
	}

	/** @param path - File path to read. @returns File contents as UTF-8 string. */
	async readFile(path: string): Promise<string> {
		return readFile(path, "utf-8");
	}

	/** @param path - Destination path. @param content - String content to write. */
	async writeFile(path: string, content: string): Promise<void> {
		await writeFile(path, content, "utf-8");
	}
}
