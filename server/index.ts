import express from "express";
import fs from "fs/promises";
import fs_sync from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Assistant } from "openai/resources/beta/assistants/assistants";
import { Thread } from "openai/resources/beta/threads/threads";
import { promisify } from "util";
import { BOTS, type Bot } from "./bots";
import { OFFICES } from "./offices";

const sleep = promisify(setTimeout);


dotenv.config({
	path: "../.env"
});
const app = express();

interface Message {
	sender: string,
	bot_info?: Bot,
	text: string,
}

interface Action {
	text: string,
	change_bot?: string,
	link?: string,
	email?: string,
	phone?: string,
	send_user_msg?: string,
}

interface Conversation {
	id: number,
	handle: Thread,
	// TODO: user data
	mostRecentBot: string,
	messages: Message[],
	actions: Action[],
}

// TODO: improvement area: use redis or some other more concurrent-safe store
const convos: Map<number, Conversation> = new Map();
let id = 0;


const OPENAI_KEY = process.env.OPENAI_KEY;
if (!OPENAI_KEY) {
	console.error("OPENAI key env not set!!!!!!! im crying and going to sleep now");
	process.exit(2);
}

let assistant: Assistant;

const openai = new OpenAI({
	apiKey: OPENAI_KEY,
});

app.use(express.static("../app/build"));
app.use(express.json());

app.get("/", (req, res) => {
	res.send("heyyyyy :3")
});

app.post("/api/conversations", async (req, res) => {
	const thread = await openai.beta.threads.create();
	id++;
	const convo: Conversation = {
		id: id,
		handle: thread,
		mostRecentBot: "sammy",
		messages: [],
		actions: [{
			text: "How can you help me?",
			send_user_msg: "What is the Crew and how can you help me?",
		}],
	}
	convos.set(id, convo);
	res.json({ id });
});



app.put("/api/conversation/:id", async (req, res) => {
	console.dir(req.body)
	const { msg, bot } = req.body;
	console.dir(bot);
	const convo = convos.get(Number.parseInt(req.params.id));
	if (!convo) return res.sendStatus(404);
	if (!msg) return res.sendStatus(400);

	// TODO
	if (bot) {
		if (!(bot in BOTS)) return res.sendStatus(404);
		convo.mostRecentBot = bot;
	}

	let instructions = BOTS[convo.mostRecentBot].instructions;

	const message = await openai.beta.threads.messages.create(convo.handle.id, {
		role: "user",
		content: msg,
	});
	convo.messages = [{ sender: "user", text: msg }, ...convo.messages];

	let run = await openai.beta.threads.runs.create(convo.handle.id, {
		assistant_id: assistant.id,
		instructions,
	});

	while (run.status !== "completed") {
		run = await openai.beta.threads.runs.retrieve(convo.handle.id, run.id);
		// TODO
		await sleep(200);
	}

	const messages = await openai.beta.threads.messages.list(convo.handle.id);
	let actions: Set<Action> = new Set();
	for (const msg of messages.data) {
		if (msg.role === "user") break;
		for (const ct of msg.content) {
			if (ct.type !== "text") {
				console.dir(ct);
				continue;
			}

			convo.messages = [{ sender: convo.mostRecentBot, bot_info: BOTS[convo.mostRecentBot], text: ct.text.value.replace(/【\d+†source】/, "") }, ...convo.messages];
			const search_text = ct.text.value.toLowerCase();
			for (const bot in BOTS) {
				if (bot === convo.mostRecentBot) continue;
				for (const kwd of BOTS[bot].keywords) {
					if (search_text.includes(kwd)) {
						actions.add({
							text: `Talk with ${BOTS[bot].name}`,
							change_bot: bot,
						});
						break;
					}
				}
			}

			for (const office in OFFICES) {
				const o = OFFICES[office];
				// TODO
				const reduce = () => Math.random() < 0.4;
				for (const kwd of o.keywords) {
					if (search_text.includes(kwd)) {
						console.dir(o.link);
						if ("link" in o && reduce()) {
							actions.add({
								text: `Visit ${office}`,
								link: o.link
							});
						}
						if ("contact" in o && reduce()) {
							if ("email" in o.contact) {
								actions.add({ text: `Email ${office}`, email: o.contact.email });
							} else if ("phone" in o.contact) {
								actions.add({ text: `Call ${office}`, phone: o.contact.phone });
							}
						}

						break;
					}
				}
			}
		}
	}
	convo.actions = [...actions];
	res.json({ messages: convo.messages, bot: BOTS[convo.mostRecentBot], current_bot: convo.mostRecentBot, actions: [...actions] });
});

app.get("/api/conversations/:id", async (req, res) => {
	const convo = convos.get(Number.parseInt(req.params.id));
	if (!convo) return res.sendStatus(404);

	res.json({ messages: convo.messages, bot: BOTS[convo.mostRecentBot], current_bot: convo.mostRecentBot, actions: convo.actions });
})


app.get("/api/bot/:id", async (req, res) => {
	console.dir(req.params.id, req.params.id in BOTS);
	if (req.params.id in BOTS) {
		const { avatar, name, color } = BOTS[req.params.id];
		res.json({ avatar, name, color });
	} else {
		return res.sendStatus(404);
	}
});
app.get("/api/bots", async (req, res) => {
	res.json(BOTS);
});

app.get("/api/resources/:id", async (req, res) => {
	// TODO
});



app.listen(3639, async () => {
	console.log("Server running on port 3639");
	try {
		const assistant_id = (await fs.readFile("../assistant.id")).toString();
		assistant = await openai.beta.assistants.retrieve(assistant_id);
		console.log("Loaded assistant from id file");

		const ids = await openai.beta.assistants.list();
		for (const a of ids.data) {
			console.dir(a);
			if (a.id !== assistant_id)
				await openai.beta.assistants.del(a.id);
		}
	} catch (e) {
		console.warn(e);
		await fs.writeFile("../database.json", JSON.stringify(OFFICES));
		const db = await openai.files.create({
			file: fs_sync.createReadStream("../database.json"),
			purpose: "assistants",
		});
		console.log("Uploaded database file")


		const context = await openai.files.create({
			file: fs_sync.createReadStream("../sammy_support_crew.txt"),
			purpose: "assistants",
		});

		assistant = await openai.beta.assistants.create({
			name: "Secretary Sammy",
			model: "gpt-4-1106-preview",
			instructions: BOTS["sammy"].instructions,
			tools: [{ type: "retrieval" }],
			file_ids: [db.id, context.id],
		});
		fs.writeFile("../assistant.id", assistant.id);
		console.log("Created new assistant");
	}
});