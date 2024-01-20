import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Assistant } from "openai/resources/beta/assistants/assistants";
import { Thread } from "openai/resources/beta/threads/threads";


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

app.put("/api/conversations", async (req, res) => {
	const data = JSON.parse(req.body);

});



app.listen(3639, async () => {
	console.log("Server running on port 3639");
	assistant = await openai.beta.assistants.create({
		name: "Secretary Sammy",
		model: "gpt-4-1106-preview",
		instructions: "You are Secretary Sammy, a chatbot that helps direct UCSC students to the right resources on campus.",
	});
});