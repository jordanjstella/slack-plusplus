'use strict';

const token = require('./config/config').token,
    commands = require('./commands'),
    botkit = require('botkit'),
    dns = require('dns'),
    logStream = require('fs').createWriteStream(require('path').resolve(__dirname, 'logging/log.txt')),
    controller = botkit.slackbot();
    
let plusplus;

const startBot = function () {
    logStream.write('Starting\n');
    plusplus = controller.spawn({
        token: token
    }).startRTM();
};

startBot();

controller.on('rtm_close', () => {
    logStream.write(`rtm_close on ${new Date()}\n`)
    const intervalID = setInterval(() => {
        logStream.write('Retrying connection...\n')
        dns.lookupService('8.8.8.8', 80, (error, hostname) => {
            if (!!hostname) {
                logStream.write('Connection found, restarting bot...\n');
                startBot();
                clearInterval(intervalID);
            }
        });
    }, 30000);
});

controller.hears('\\+\\+', 'ambient,direct_message', commands.addRep);
controller.hears('--', 'ambient,direct_message', commands.subtractRep);