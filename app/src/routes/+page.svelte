<script lang="ts">
	let convo: string | null = null;

	convo = localStorage.getItem("convo");
	$: if (convo) {
		fetchChat(convo);
	}

	let messages: {
		msg: { text: { value: string } }[];
		from: "user" | "assistant";
		time: number;
	}[] = [];

	async function fetchChat(convo: string) {
		const res = await fetch(`/api/conversations/${convo}`);
		if (!res.ok) {
			newConvo();
			return;
		}
		const json = await res.json();
		messages = json;
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
	$: console.dir(convo);

	let sending = false;

	async function sendMsg() {
		if (sending) return;
		sending = true;
		messages = [
			{ msg: [{ text: { value: msg } }], from: "user", time: Date.now() },
			...messages,
		];
		const res = await fetch(`/api/conversation/${convo}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ msg }),
		});
		if (res.ok) {
			messages = await res.json();
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
	<div id="middle">
		<div id="chat">
			{#if sending}
				<div class="assistant"><p>...</p></div>
			{/if}
			{#each messages as message}
				<div class={message.from}>
					{#each message.msg as text}
						{#each text.text.value.split("\n") as txt}
							<p>
								{txt}
							</p>
						{/each}
					{/each}
				</div>
			{/each}
		</div>

		<form on:submit|preventDefault={sendMsg}>
			<input type="text" required disabled={sending} bind:value={msg} />
			<button type="submit" disabled={sending}>Send</button>
		</form>
	</div>
	<div style:width={"10vw"}></div>
</div>

<style>
	#page {
		display: flex;
		justify-content: right;
	}

	#middle {
		flex-grow: 0;
		width: min(100vw, 60rem);
		display: flex;
		flex-direction: column;
		gap: 2rem;
		height: 100vh;
	}
	#chat {
		font-family: sans-serif;
		display: flex;
		flex-direction: column-reverse;
		gap: 1rem;
		overflow-y: scroll;
		flex-grow: 1;
	}

	#chat > div {
		padding-left: 1rem;
		padding-right: 1rem;
		font-size: 1.2rem;
		border-radius: 2rem;
	}

	.assistant {
		background-color: #fdc700;
		margin-right: auto;
	}

	.user {
		background-color: #003c6c;
		color: white;
		margin-left: auto;
	}
	form {
		margin-top: auto;
		margin-bottom: 2rem;
		display: flex;
		flex-direction: row;
		width: 100%;
		gap: 3rem;
		max-height: 20vh;
	}
	form * {
		font-size: 1.2rem;
		border-radius: 2rem;
		padding: 1rem 2rem;
		border: none;
	}
	form input {
		flex-grow: 1;
		border: 0.2rem solid #003c6c;
	}

	form button {
		border: none;
		background-color: #fdc700;
		flex-grow: 0;
	}
</style>
