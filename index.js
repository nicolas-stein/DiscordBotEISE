const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('config');
const pjson = require('./package.json')

//Variables globales
var token;
var adminIDs;
var guildID;
var channelBienvenueID;
var channelGeneralID;
var emojiStudentId;
var emojiTeacherId;
var roleStudentId;
var roleTeacherId;

//Fonction d'initialisation du bot une fois qu'il est connecté à Discord
async function initBot(){
	console.log(`[I] Connecté en tant que ${client.user.tag} !`);
	guild = await client.guilds.fetch(guildID).catch(error => {
		console.error(`[E] Impossible de récupérer la guild !\n${error}`)
		return;
	});
	console.log(`[I] Utilisation du serveur : ${guild.name}`);
	var members = await guild.members.fetch().catch((error) => {
		console.error(`[E] Erreur lors la récupération des utilisateurs du serveur !\n${error}`);
		return;
	});
	console.log(`[I] ${members.size} membres sur le serveur.`);

	//On vide le salon #bienvenue
	var channelBienvenue = await client.channels.cache.get(channelBienvenueID);
	if(channelBienvenue==null){
		console.error("[E] Erreur lors de la récupération du salon #bienvenue !");
		return;
	}
	(await channelBienvenue.messages.fetch().catch((error) => {
		console.error("[E] Erreur lors de la récupération des messages du salon #bienvenue !");
	})).forEach(message => {
		message.delete();
	});

	members.forEach(member =>{
		if(!member.bot && member.roles.cache.size <=1){
			sendWelcomeMessage(member);
		}
	});


	client.on('message', (message) => {
		if(message.channel.type=="dm" && adminIDs.includes(message.author.id)){
			if(message.content=="version"){
				message.reply(`Version du bot : ${pjson.version}`);
			}
		}
	});

	client.on('guildMemberAdd', (member) =>{
		if(member.guild.id==guildID && !member.bot){
			sendWelcomeMessage(member);
		}
	});

	client.on("guildMemberUpdate", (oldMember, newMember) =>{
		if(!newMember.bot && oldMember.roles.cache.size>1 && newMember.roles.cache.size<=1){
			sendWelcomeMessage(newMember);
		}
	});
}

//Envoyer le message de bienvenue
function sendWelcomeMessage(member){
	const welcomeEmbed = new Discord.MessageEmbed()
		.setColor("#0099FF")
		.setTitle("Bienvenue !")
		.setDescription(`Je te souhaite la bienvenue ${member} sur le serveur Discord des EI-SE3.`)
		.addField("__**Attention une dernière étape :**__", "Pour acceder au serveur tu dois choisir un rôle en cliquant l'icone adaptée sous ce message !", false)
		.addFields({name : "Etudiant", value : `Cliquer sur ${client.emojis.cache.get(emojiStudentId)} ci-dessous`, inline : true},
			{name : "Professeur", value : `Cliquer sur ${client.emojis.cache.get(emojiTeacherId)} ci-dessous`, inline : true});
	client.channels.cache.get(channelBienvenueID).send(welcomeEmbed).catch((error) => {
				console.warn(`[W] Impossible d'envoyer le message de bienvenue !\n${error}`);
			}).then(message => {
				message.react(guild.emojis.cache.get(emojiStudentId)).catch((error) => {
					console.warning(`[W] Impossible de réagir au message de bienvenue !\n${error}`);
				}).then(() =>{
					message.react(guild.emojis.cache.get(emojiTeacherId)).catch((error) => {
						console.warning(`[W] Impossible de réagir au message de bienvenue !\n${error}`);
					}).then(() => {
						collector = message.createReactionCollector((reaction, user) => {return user.id === member.id && (reaction.emoji.id==emojiStudentId || reaction.emoji.id==emojiTeacherId);}, {});
						collector.on("collect", (reactionChoice, user) => {
							message.delete();
							var messageConfirmText;
							var confirmEmbed = new Discord.MessageEmbed()
								.setColor("#0099FF")
								.setThumbnail(`https://cdn.discordapp.com/emojis/${reactionChoice.emoji.id}.png`);
							if(reactionChoice.emoji.id==emojiTeacherId){
								confirmEmbed.setTitle("Professeur")
								.setDescription(`${member} tu confirmes être un **professeur** ?\n(choisis ci-dessous)`);
							}
							else{
								confirmEmbed.setTitle("Etudiant")
								.setDescription(`${member} tu confirmes être un **étudiant** ?\n(choisis ci-dessous)`);
							}
							client.channels.cache.get(channelBienvenueID).send(confirmEmbed).catch((error) => {
								console.warn(`[W] Impossible d'envoyer le message de confirmation !\n${error}`);
							}).then(messageConfirm => {
								messageConfirm.react("✅")
									.catch((error) => {
										console.warning(`[W] Impossible de réagir au message de confirmation !\n${error}`);
								}).then(() => {
									messageConfirm.react("❌")
										.catch((error) => {
											console.warning(`[W] Impossible de réagir au message de confirmation !\n${error}`);
										})
										.then(() => {
											collectorConfirm = messageConfirm.createReactionCollector((reaction, user) => {return user.id === member.id && (reaction.emoji.name=="✅" || reaction.emoji.name=="❌");}, {});
											collectorConfirm.on("collect", (reactionConfirm, user) => {
												if(reactionConfirm.emoji.name=="❌"){
													messageConfirm.delete();
													sendWelcomeMessage(member);
												}
												else{
													client.channels.cache.get(channelBienvenueID).send(`Tu peux désormais rejoindre le serveur !\n**Cliques ici : <#${channelGeneralID}>**`)
														.catch((error) => {
															console.warning(`[W] Impossible d'envoyer le message d'information !\n${error}`);
														})
														.then(messageInfo => {
															if(reactionChoice.emoji.id == emojiTeacherId){
																member.roles.add(roleTeacherId).catch((error) => {
																	console.warning(`[W] Impossible d'ajouter le rôle !\n${error}`);
																});
															}
															else{
																member.roles.add(roleStudentId).catch((error) => {
																	console.warning(`[W] Impossible d'ajouter le rôle !\n${error}`);
																});
															}
															setTimeout(function() {
																messageInfo.delete();
															}, 500);
														});
													messageConfirm.delete();
												}
											});
										});
								});
							});							
						});
					});
				});
			});
}

//Main
//Lecture de la configuration
try{
	token = config.get("Discord.token");
	adminIDs = config.get("Discord.adminID").split(";");
	guildID = config.get("Discord.server.id");
	channelBienvenueID = config.get("Discord.server.channels.bienvenue");
	channelGeneralID = config.get("Discord.server.channels.general");
	emojiStudentId = config.get("Discord.server.emojis.student");
	emojiTeacherId = config.get("Discord.server.emojis.teacher");
	roleStudentId = config.get("Discord.server.roles.student");
	roleTeacherId = config.get("Discord.server.roles.teacher");
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