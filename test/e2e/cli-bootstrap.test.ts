import { runCli } from "./helpers/e2e-utils";

describe("CLI bootstrap", () => {
	describe("help output", () => {
		it("shows usage information with --help", () => {
			const result = runCli(["--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("prlint <command>");
		});

		it("lists all available commands in help output", () => {
			const result = runCli(["--help"]);
			const output: string = result.stdout;

			expect(output).toContain("context");
			expect(output).toContain("lint");
			expect(output).toContain("generate");
			expect(output).toContain("create");
			expect(output).toContain("fix");
		});

		it("shows command descriptions in help output", () => {
			const result = runCli(["--help"]);
			const output: string = result.stdout;

			expect(output).toContain("Collect and display PR context");
			expect(output).toContain("Lint the current PR");
			expect(output).toContain("Generate a PR title and body");
		});

		it("shows lint command help with lint --help", () => {
			const result = runCli(["lint", "--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("--json");
		});

		it("shows generate command help with generate --help", () => {
			const result = runCli(["generate", "--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("--json");
		});

		it("shows create command help with create --help", () => {
			const result = runCli(["create", "--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("--json");
		});

		it("shows fix command help with fix --help", () => {
			const result = runCli(["fix", "--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("--json");
		});

		it("shows context command help with context --help", () => {
			const result = runCli(["context", "--help"]);

			expect(result.exitCode).toBe(0);
			expect(result.stdout).toContain("--json");
		});
	});

	describe("error handling", () => {
		it("exits with non-zero code when no command is provided", () => {
			const result = runCli([]);

			expect(result.exitCode).not.toBe(0);
		});

		it("indicates that a command is required when none is provided", () => {
			const result = runCli([]);
			const output: string = result.stdout + result.stderr;

			expect(output).toContain("Please specify a command");
		});

		it("exits with non-zero code for unknown command", () => {
			const result = runCli(["nonexistent"]);

			expect(result.exitCode).not.toBe(0);
		});
	});
});
