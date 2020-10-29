const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('config');

//Variables globales
var token;
var adminIDs;
var guildID;
var channelBienvenueID;

//Fonction d'initialisation du bot une fois qu'il est connecté à Discord
async function initBot(){
	console.log(`[I] Connecté en tant que ${client.user.tag} !`);
	guild = await client.guilds.fetch(guildID).catch(error => {
		console.error(`[E] Impossible de récupérer la guild !\n${error}`)
		return;
	});
	console.log(`[I] Utilisation du serveur : ${guild.name}`);
	var members = await guild.members.fetch();
	console.log(`[I] ${members.size} membres sur le serveur.`);

	//On vide le salon #bienvenue
	var messagesBienvenue = await client.channels.cache.get(channelBienvenueID).messages.fetch();
	messagesBienvenue.forEach(message => {
		message.delete();
	});
	members.forEach(member =>{
		if(!member.bot && member.roles.cache.size <=1){
			client.channels.cache.get(channelBienvenueID).send(`Bienvenue ${member} !`).catch((error) => {
				console.warn(`[W] Impossible d'envoyer le message de bienvenue !\n${error}`);
			});
		}
	});


	client.on('message', (message) => {
		if(message.channel.type=="dm" && adminIDs.includes(message.author.id)){
			if(message.content=="ping"){
				message.reply("pong");
			}
		}
	});

	client.on('guildMemberAdd', (member) =>{
		if(member.guild.id==guildID){
			client.channels.cache.get(channelBienvenueID).send(`Bienvenue ${member} !`).catch((error) => {
				console.warn(`[W] Impossible d'envoyer le message de bienvenue !\n${error}`);
			});
		}
	});
}

//Main
//Lecture de la configuration
try{
	token = config.get("Discord.token");
	adminIDs = config.get("Discord.adminID").split(";");
	guildID = config.get("Discord.server.id");
	channelBienvenueID = config.get("Discord.server.channels.bienvenue");
}
catch(error){
	console.error(`[E] Erreur lors du chargement de la configuration !\n${error}`);
	process.exit();
}

//Connexion du bot à Discord
client.on('ready', () => {
	initBot();
});
client.login(token).catch((error) => {
	console.error(`[E] Erreur lors de la connexion du bot à Discord !\n${error}`);
});