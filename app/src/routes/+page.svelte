<script lang="ts">
	let convo: string | null = null;

	convo = localStorage.getItem("convo");
	$: if (convo) {
		fetchChat(convo);
	}

	interface Bot {
		name: string;
		color: string;
		avatar: string;
		white: boolean;
	}

	let messages: {
		sender: string;
		text: string;
		bot_info?: Bot;
	}[] = [];

	let bots: Record<string, Bot> = {};

	fetch("/api/bots")
		.then((res) => res.json())
		.then((json) => (bots = json))
		.catch(console.error);

	let bot = "sammy";
	let bot_info: Bot;
	let actions: {
		text: string;
		change_bot?: string;
		link?: string;
		email?: string;
		phone?: string;
		send_user_msg?: string;
	}[] = [];
	fetchBot(bot).catch(console.error);

	async function fetchBot(bot: string) {
		const res = await fetch(`/api/bot/${bot}`);
		if (res.ok) {
			bot_info = await res.json();
		}
	}

	// $: fetchBot(bot);

	async function fetchChat(convo: string) {
		const res = await fetch(`/api/conversations/${convo}`);
		if (!res.ok) {
			newConvo();
			return;
		}
		const json = await res.json();
		console.dir(json);
		bot_info = json.bot;
		messages = json.messages;
		actions = json.actions;
		bot = json.current_bot;
	}

	async function newConvo() {
		localStorage.removeItem("convo");
		const res = await fetch("/api/conversations", { method: "POST" });
		const { id } = await res.json();
		convo = id;
		localStorage.setItem("convo", id);
	}

	if (!convo) {
		newConvo();
	}

	let sending = false;

	async function sendMsg() {
		if (sending) return;
		sending = true;
		console.dir(bot, bots[bot]);
		messages = [
			{ sender: bot, bot_info: bots[bot], text: "..." },
			{ sender: "user", text: msg },
			...messages,
		];
		actions = [];
		const res = await fetch(`/api/conversation/${convo}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ msg, bot }),
		});
		if (res.ok) {
			const json = await res.json();
			messages = json.messages;
			bot_info = json.bot;
			actions = json.actions;
			// dont erase msg on failure
			msg = "";
		} else {
			newConvo();
		}
		sending = false;
	}

	let msg = "";
</script>

<div id="page">
	<div id="image">
		<img class="logo" alt="sammy support crew logo" src="/logo.png" />
		<img class="sprite" alt={bots[bot]?.name} src={bots[bot]?.avatar} />
		<p>{bots[bot]?.name}</p>
	</div>
	<div id="middle">
		<div id="chat">
			<div id="actions">
				{#if actions.length > 0}
					<h2>Try:</h2>
				{/if}
				{#each actions as action}
					<button
						style:background-color={bots[action.change_bot ?? ""]
							?.color}
						class:white={bots[action.change_bot ?? ""]?.white}
						on:click={async () => {
							if (action.change_bot) {
								bot = action.change_bot;
								bot_info = bots[bot];
							} else if (action.link) {
								window.open(action.link, "_blank");
							} else if (action.send_user_msg) {
								let tmp = msg;
								msg = action.send_user_msg;
								await sendMsg();
								msg = tmp;
							}
						}}>{action.text}</button
					>
				{/each}
			</div>
			{#each messages as message}
				<div
					class="msg-container"
					class:user={message.sender === "user"}
					class:assistant={message.sender !== "user"}
				>
					<img
						src={message.bot_info?.avatar ?? "/user.png"}
						alt={message.bot_info?.name ?? "user"}
					/>
					<div
						class="message"
						class:white={message.bot_info?.white ?? false}
						style:background-color={message.bot_info?.color ??
							"#003c6c"}
					>
						{#each message.text.split("\n") as txt}
							<p>{txt}</p>
						{/each}
					</div>
				</div>
			{/each}
		</div>
		<div id="sendbox">
			<div id="bots">
				{#each Object.keys(bots) as bot_name}
					<button
						style:border-color={bots[bot_name].color}
						disabled={bot_name === bot}
						on:click={() => (bot = bot_name)}
						title={bots[bot_name].name}
						><img
							alt={bots[bot_name].name}
							src={bots[bot_name].avatar}
						/></button
					>
				{/each}
			</div>

			<form on:submit|preventDefault={sendMsg} id="send">
				<input
					type="text"
					required
					disabled={sending}
					bind:value={msg}
				/>
				<button type="submit" disabled={sending}>Send</button>
			</form>
		</div>
	</div>

	<div style:width={"10vw"}></div>
</div>

<style>
	:global(body) {
		background-color: #ffffcc;
	}

	#page {
		display: flex;
		justify-content: right;
		gap: min(5vw, 8rem);
	}

	#image {
		display: flex;
		flex-shrink: 1;
		flex-direction: column;
		height: 98vh;
		justify-content: center;
		align-items: center;
	}

	#image .logo {
		align-self: center;
		max-width: min(25vw, 25rem);
	}

	#image .sprite {
		align-self: center;
		max-height: 90vh;
		max-width: min(30vw, 30rem);
	}

	#image p {
		font: 1.2rem sans-serif;
	}

	#middle {
		flex-grow: 0;
		width: min(55vw, 100rem);
		display: flex;
		flex-direction: column;
		gap: 2rem;
		height: 98vh;
	}
	#chat {
		font-family: sans-serif;
		display: flex;
		flex-direction: column-reverse;
		gap: 1rem;
		overflow-y: scroll;
		flex-grow: 1;
	}

	.msg-container {
		display: flex;
	}

	#actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
		/* flex-wrap: wrap; */
	}

	#actions button {
		cursor: pointer;
		font-size: 1rem;
		border-radius: 2rem;
		padding: 0.5rem 0.5rem;
		border: none;
	}

	.msg-container.user {
		justify-content: right;
		flex-direction: row-reverse;
	}
	.msg-container.assistant {
		justify-content: left;
		flex-direction: row;
	}

	.msg-container img {
		padding: 0.5rem;
		height: 3rem;
	}

	.message {
		padding-left: 1rem;
		padding-right: 1rem;
		font-size: 1.2rem;
		border-radius: 2rem;
	}

	.white {
		color: white;
	}

	.assistant .message {
		/* background-color: #fdc700; */
		margin-right: auto;
	}

	.user .message {
		background-color: #003c6c;
		color: white;
		margin-left: auto;
	}
	#sendbox {
		margin-top: auto;
		margin-bottom: 2rem;
		max-height: 20vh;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	#send {
		display: flex;
		flex-direction: row;
		gap: 3rem;
	}
	#send * {
		font-size: 1.2rem;
		border-radius: 2rem;
		padding: 1rem 2rem;
		border: none;
	}
	#send input {
		flex-grow: 1;
		border: 0.2rem solid #003c6c;
	}

	#bots {
		display: flex;
		flex-direction: row-reverse;
		justify-content: right;
		gap: 0.5rem;
	}

	#bots button {
		font-size: 1.2rem;
		border-radius: 2rem;
		padding: 0.5rem;
		border: 0.4rem solid;
		background-color: white;
	}

	#bots img {
		height: 5rem;
	}

	#bots button:disabled {
		border-width: 0.8rem;
	}

	#send button {
		border: none;
		background-color: #003c6c;
		color: white;
		flex-grow: 0;
	}
</style>
