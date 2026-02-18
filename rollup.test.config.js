import typescript from "@rollup/plugin-typescript";

const external = ["@anthropic-ai/sdk", "@elsikora/cladi", "@google/generative-ai", "chalk", "cosmiconfig", "dotenv", "dotenv/config", "openai", "ora", "path-to-regexp", "yargs", "yargs/helpers", /^node:.+/];

export default {
	external,
	input: "src/cli.ts",
	output: {
		banner: "#!/usr/bin/env node",
		dir: "bin",
		exports: "auto",
		format: "esm",
		preserveModules: false,
		sourcemap: true,
	},
	plugins: [
		typescript({
			declaration: true,
			outDir: "bin",
			sourceMap: true,
			tsconfig: "./tsconfig.json",
		}),
	],
};
