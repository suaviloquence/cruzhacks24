import express from "express";
import dotenv from "dotenv";


dotenv.config();
const app = express();

app.get("/", (req, res) => {
	res.send("heyyyyy :3")
});

app.listen(3639, () => {
	console.log("Server running on port 3639");
});