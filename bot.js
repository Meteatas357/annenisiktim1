// Deps
const Discord = require('discord.js')
const fs = require('fs')
const Config = require("./config.json")

const Client = new Discord.Client();
const Flags = JSON.parse(fs.readFileSync('./flags.json'))
const Data = JSON.parse(fs.readFileSync('./data.json'))

Client.on('ready',() => console.log('Bot Online!'))



Client.on('guildMemberAdd', async member => {
    if(member.guild.id !== Config.guildID) return;

    let welcomeEmbed = new Discord.MessageEmbed()
    .setDescription(welcomeEmbed)
    
    await member.send(Data.welcome)
    
    let nextForm = Data.form[0]
    let rolesDisplay = ''
    let rolesReact = []
    for (let rol of nextForm.roles) {
        let emoji = Client.emojis.cache.get(rol.emoji)
        if (!emoji) emoji = rol.emoji

        if (Object.keys(Flags).includes(emoji)) {
            rolesReact.push(Flags[emoji])
            emoji = `:${emoji}:`
        }else rolesReact.push(emoji)

        rolesDisplay += `${emoji} ${rol.displayText}\n`
    }

    let editEmbed = new Discord.MessageEmbed()
    .setTitle(nextForm.title)
    .setDescription(`${nextForm.msg}\n\n${rolesDisplay}`)
    member.send(editEmbed)
    .then(async msg => {
        for (let emoji of rolesReact) {
            await msg.react(emoji)
        }
    })
})

Client.on('raw', async packet => {
    try { 
        if (packet.t !== 'MESSAGE_REACTION_ADD') return;

        let channel = Client.channels.cache.get(packet.d.channel_id)
        if(!channel) channel = await Client.channels.fetch(packet.d.channel_id)
 
        if(channel.type !== 'dm') return;
 
        let guild = Client.guilds.cache.get(Config.guildID)
        let member = guild.member(packet.d.user_id)
        if(!member) member = await guild.members.fetch(packet.d.user_id)
        if(member.id == Client.user.id) return;
   
        let message = await channel.messages.fetch(packet.d.message_id)
  
        if(message.author.id !== Client.user.id) return;
        let title = message.embeds[0].title
        if(!title) return;

        let nowForm = Data.form.find(f => f.title == title)
        if(!nowForm) return;

        var roleSelected = null
        if(packet.d.emoji.id == null) {
            if(Object.keys(Flags).some(f => getCountryFlag(f.split('_')[1]) == packet.d.emoji.name)) {
                let findEscapedString =  Object.keys(Flags).find(f => getCountryFlag(f.split('_')[1]) == packet.d.emoji.name)
                roleSelected = nowForm.roles.find(r => r.emoji == findEscapedString)
            }else roleSelected = nowForm.roles.find(r => r.emoji == packet.d.emoji.name)
        }
        else roleSelected = nowForm.roles.find(r => r.emoji == packet.d.emoji.id)
    
        if(!roleSelected) return;

        member.roles.add(roleSelected.id)
        .catch(() => console.log(`I Couldn't give the role ${roleSelected.id} to ${member.displayName}`))

        let formIndex = Data.form.findIndex(f => f.title == title)

        if(!Data.form[formIndex + 1]) {
            let byEmbed = new Discord.MessageEmbed()
            .setDescription(Data.bye)
            await message.delete()
            return member.send(byEmbed)
        }

        let nextForm = Data.form[formIndex + 1]
        let rolesDisplay = ''
        let rolesReact = []
        for (let rol of nextForm.roles) {
            let emoji = Client.emojis.cache.get(rol.emoji)
            if (!emoji) emoji = rol.emoji

            if (Object.keys(Flags).includes(emoji)) {
                rolesReact.push(Flags[emoji])
                emoji = `:${emoji}:`
            }else rolesReact.push(emoji)

            rolesDisplay += `${emoji} ${rol.displayText}\n`
        }

        let editEmbed = new Discord.MessageEmbed()
        .setTitle(nextForm.title)
        .setDescription(`${nextForm.msg}\n\n${rolesDisplay}`)
        await message.delete()
        channel.send(editEmbed)
        .then(async msg => {
            for (let emoji of rolesReact) {
                await msg.react(emoji)
            }
        })
    } catch(e) {throw e}
})


function getCountryFlag(cc) {

    function risl(chr) {
      return String.fromCodePoint(0x1F1E6 - 65 + chr.toUpperCase().charCodeAt(0));
    }
  
    return risl(cc[0]) + risl(cc[1]);
  }

Client.login(Config.token)