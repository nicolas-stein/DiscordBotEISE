const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('config');

var token;
var adminIDs;
try{
	token = config.get("Discord.token");
	adminIDs = config.get("Discord.admin").split(";")
}
catch(error){
	console.error(`Erreur lors du chargement de la configuration !\n${error}`);
	process.exit();
}

client.on('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag} !`);
});

client.on('message', (message) => {
	if(message.channel.type=="dm" && adminIDs.includes(message.author.id)){
		if(message.content=="ping"){
			message.reply("pong");
		}
	}
});

client.login(token).catch((error) => {
	console.error(`Erreur lors de la connexion du bot à Discord !\n${error}`);
});