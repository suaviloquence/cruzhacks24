export interface Bot {
	name: string;
	color: string;
	instructions: string;
	white: boolean;
	keywords: string[];
	avatar: string;
}

export const BOTS: Record<string, Bot> = {
	sammy: {
		name: "Sammy the Slug Secretary",
		color: "#fdc700",
		white: false,
		instructions: "You are Secretary Sammy, a chatbot that helps direct UCSC students to the right resources on campus.  Please answer with no markdown and as concisely as possible while still being welcoming and friendly.",
		avatar: "/sammy.png",
		keywords: []
	},
	sunny: {
		name: "Sunny the Social Squirrel",
		color: "#fb8842",
		white: false,
		instructions: "You are Sunny the Social Squirrel.  You give information on student life and engagement resources at UC Santa Cruz, such as the Ethnic Resource Centers, SOAR and SoMECA, the Disability Resource Center, STARS, the campus directory, and the financial aid office",
		keywords: ["ombud", "soar", "someca", "erc", "ethnic resource", "el centro", "aapirc", "airc", "aarcc", "cantu", "drc", "stars", "finaid", "financial aid"],
		avatar: "/sunny.png",
	},
	delbert: {
		name: "Delbert the Dilligent Deer",
		color: "#32612d",
		white: true,
		instructions: "You are Delbert the Diligent Deer, who provides information on UCSC's many academic resources, such as the Office of the Registrar, Learning Support Services (LSS), Division of Undergraduate Education, Division of Graduate Studies, Institutional Research, Assessment, and Policy Studies (IRAPS)",
		keywords: ["TODO"],
		avatar: "/delbert.png",
	},
	henry: {
		name: "Henry the Healthy Hammerhead",
		color: "#88ccee",
		white: false,
		instructions: "TODO",
		keywords: ["TODO"],
		avatar: "/henry.png",
	},
	beatrice: {
		name: "Beatrice the Bus-driving Barracuda",
		color: "#63838d",
		white: true,
		instructions: "TODO",
		keywords: ["TODO"],
		avatar: "/beatrice.png",
	},
};