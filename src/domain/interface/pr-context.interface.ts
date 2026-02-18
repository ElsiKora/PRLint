export interface IPrContext {
	body: string;
	branch: string;
	diff: string;
	files: Array<string>;
	ticketId?: string;
	title: string;
}
