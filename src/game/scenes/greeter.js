const Scene = require('telegraf/scenes/base');

// Works as a pre-lobby manager.
const greetMsg = 'Add this bot to a group to play Fodinha.\n/new: Creates a new match.\n/join: Joins the match.\n/start: Starts the match.';
const groupHelp = 'Send /new to create a new match.'

const greeter = new Scene('greeter');

greeter.command('start', ({ chat, reply }) => {
    if (chat.type === 'private') {
        reply(greetMsg);
    }
});

greeter.command('new', ({ from, chat, scene, reply, session }) => {
    if (chat.type === 'group') {
        session.lobby = { owner: from, groupId: chat.id, }
        session.game = {};
        scene.enter('lobby');
    }
    else {
        reply('To start a new match, you need to add this bot to a group.');
    }
});

greeter.command('join', (ctx) => ctx.reply(`There's no active lobby.`));

greeter.help(({ chat, reply }) => {
    if (chat.type === 'group') {
        reply(groupHelp);
    }
    else {
        reply(greetMsg)
    }
});

module.exports = greeter;