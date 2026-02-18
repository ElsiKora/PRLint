import { createContainer } from "@elsikora/cladi";
import type { IContainer } from "@elsikora/cladi";
import "dotenv/config";

import type { ILlmService } from "../../application/interface/llm-service.interface";
import { CollectContextUseCase } from "../../application/use-case/collect-context.use-case";
import { CreateOrUpdatePrUseCase } from "../../application/use-case/create-or-update-pr.use-case";
import { FixPrUseCase } from "../../application/use-case/fix-pr.use-case";
import { GeneratePrUseCase } from "../../application/use-case/generate-pr.use-case";
import { LintPrUseCase } from "../../application/use-case/lint-pr.use-case";
import { BranchTicketIdParser } from "../git/branch-ticket-id-parser.service";
import { GitRepoService } from "../git/git-repo.service";
import { GhCliGitHubRepoService } from "../github/gh-cli-github-repo.service";
import { AnthropicLlmService } from "../llm/anthropic-llm.service";
import { GoogleLlmService } from "../llm/google-llm.service";
import { OllamaLlmService } from "../llm/ollama-llm.service";
import { OpenAILlmService } from "../llm/openai-llm.service";
import { CosmicBranchLintConfigService } from "../service/cosmic-branch-lint-config.service";
import { CosmicConfigService } from "../service/cosmic-config.service";
import { NodeCommandService } from "../service/node-command.service";
import { NodeFileSystemService } from "../service/node-file-system.service";
import {
	BranchLintConfigServiceToken,
	CollectContextUseCaseToken,
	CommandServiceToken,
	ConfigServiceToken,
	CreateOrUpdatePrUseCaseToken,
	FileSystemServiceToken,
	FixPrUseCaseToken,
	GeneratePrUseCaseToken,
	GitHubRepoServiceToken,
	GitRepoServiceToken,
	LintPrUseCaseToken,
	LlmServicesToken,
	TicketIdParserToken,
} from "./token.constant";

/** Assembles and returns the fully wired DI container for the application. */
export async function createAppContainer(): Promise<IContainer> {
	const container = createContainer({});

	const commandService = new NodeCommandService();
	container.register(CommandServiceToken, commandService);

	const fileSystemService = new NodeFileSystemService();
	container.register(FileSystemServiceToken, fileSystemService);

	const configService = new CosmicConfigService();
	container.register(ConfigServiceToken, configService);

	const branchLintConfigService = new CosmicBranchLintConfigService();
	container.register(BranchLintConfigServiceToken, branchLintConfigService);

	const gitRepoService = new GitRepoService(commandService);
	container.register(GitRepoServiceToken, gitRepoService);

	const ticketIdParser = new BranchTicketIdParser(configService, branchLintConfigService);
	container.register(TicketIdParserToken, ticketIdParser);

	const llmServices: Array<ILlmService> = [];

	if (process.env["OPENAI_API_KEY"]) {
		llmServices.push(new OpenAILlmService(process.env["OPENAI_API_KEY"]));
	}

	if (process.env["ANTHROPIC_API_KEY"]) {
		llmServices.push(new AnthropicLlmService(process.env["ANTHROPIC_API_KEY"]));
	}

	if (process.env["GOOGLE_API_KEY"]) {
		llmServices.push(new GoogleLlmService(process.env["GOOGLE_API_KEY"]));
	}

	llmServices.push(new OllamaLlmService(process.env["OLLAMA_BASE_URL"]));

	container.register(LlmServicesToken, llmServices);

	const githubRepoService = new GhCliGitHubRepoService(commandService);
	container.register(GitHubRepoServiceToken, githubRepoService);

	container.register(LintPrUseCaseToken, new LintPrUseCase());
	container.register(CollectContextUseCaseToken, new CollectContextUseCase(gitRepoService, ticketIdParser));
	container.register(GeneratePrUseCaseToken, new GeneratePrUseCase(llmServices));
	container.register(FixPrUseCaseToken, new FixPrUseCase(llmServices));
	container.register(CreateOrUpdatePrUseCaseToken, new CreateOrUpdatePrUseCase(githubRepoService));

	return container;
}
