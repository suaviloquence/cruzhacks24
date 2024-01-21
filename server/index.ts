import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Assistant } from "openai/resources/beta/assistants/assistants";
import { Thread } from "openai/resources/beta/threads/threads";
import { promisify } from "util";

const sleep = promisify(setTimeout);


dotenv.config({
	path: "../.env"
});
const app = express();

interface Bot {
	id: number,
	name: string,
	// URL
	picture: string,
	context: string
}

//bot constants --> add the specifics later COME BACK TO ME

const nameOfBot1 = {
	id: 0o1,
	name: "Title IX Racoon",
	url: "https://bbla bla bla",
	picture:"yuhhhh",
	context: "this pookie deals with any violations with title ix bla bla bla"

}
const nameOfBot2 = {
	id: 0o2,
	name: "Title IX Racoon",
	url: "https://bbla bla bla",
	picture:"yuhhhh",
	context: "this pookie deals with any violations with title ix bla bla bla"

}
const nameOfBot3 = {
	id: 0o3,
	name: "Title IX Racoon",
	url: "https://bbla bla bla",
	picture:"yuhhhh",
	context: "this pookie deals with any violations with title ix bla bla bla"

}
const nameOfBot4 = {
	id: 0o4,
	name: "Title IX Racoon",
	url: "https://bbla bla bla",
	picture:"yuhhhh",
	context: "this pookie deals with any violations with title ix bla bla bla"

}
const nameOfBot5 = {
	id: 0o5,
	name: "Title IX Racoon",
	url: "https://bbla bla bla",
	picture:"yuhhhh",
	context: "this pookie deals with any violations with title ix bla bla bla"

}

interface Conversation {
	id: number,
	handle: Thread,
	// TODO: user data
	mostRecentBot: number,
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

app.use(express.static("../static"));
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
		mostRecentBot: 0,
	}
	convos.set(id, convo);
	res.json({ id });
});

app.put("/api/conversations/:id", async (req, res) => {
	console.dir(req.body)
	const { msg, bot } = req.body;
	const convo = convos.get(Number.parseInt(req.params.id));
	if (!convo) return res.sendStatus(404);
	if (!msg) return res.sendStatus(400);

	let instructions = undefined;
	// TODO
	if (bot) {
	}

	const message = await openai.beta.threads.messages.create(convo.handle.id, {
		role: "user",
		content: msg,
	});
	console.dir(message);

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
	console.dir(messages);
	res.json(messages);
});

app.get("/api/conversations/:id", async (req, res) => {
	const convo = convos.get(Number.parseInt(req.params.id));
	if (!convo) return res.sendStatus(404);

	const messages = await openai.beta.threads.messages.list(convo.handle.id);
	console.dir(messages);
	res.json(messages);
})

/*
app.get("/api/bot/:id", async (req, res) => {
	gets one bot
})
app.get("/api/bot/bots", async (req, res) => {
	gets the list of bots, maybe a clickable page with the bots but kinda like a staff page
})
app.get("/api/resources/:id", async (req, res) => {
	static page of the resource, just the information
})
*/


app.listen(3639, async () => {
	console.log("Server running on port 3639");
	assistant = await openai.beta.assistants.create({
		name: "Secretary Sammy",
		model: "gpt-4-1106-preview",
		instructions: "You are Secretary Sammy, a chatbot that helps direct UCSC students to the right resources on campus.",
	});
});