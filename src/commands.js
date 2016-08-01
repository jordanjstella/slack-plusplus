const request = require('request'),
    jsonfile = require('jsonfile'),
    token = require('./config/config').token,
    services = require('./services'),
    InputParser = require('./parser'),
    storageFile = require('path').resolve(__dirname, 'data/rankings.json'),
    users = {};

request(services.slackUsers(token), (err, response, body) => {
    const members = JSON.parse(body).members;
    for (const member of members) {
        users[member.id] = member.name;
    }
    console.log(`${Object.keys(users).length} Users Found`);
});

const getRanks = cb => {
    jsonfile.readFile(storageFile, (err, stored) => {
        cb(stored);
    });
}

const updateRanks = (obj, cb) => {
    jsonfile.writeFile(storageFile, obj, cb);
};

const updateRep = (message, add, cb) => {
    const text = message.text.split(' ');

    if (InputParser.isValid(text)) {
        const target = InputParser.getTarget(text[0], users),
            sameUser = InputParser.getUserId(text[0]) === message.user
            || target.toLowerCase() === users[message.user];

        getRanks(stored => {
            if (stored[target] === undefined) {
                stored[target] = 0;
            }
            if (add && !sameUser) {
                stored[target] = stored[target] + 1;
            }
            else {
                stored[target] = stored[target] - 1;
            }
            updateRanks(stored, err => {
                cb(err, target, stored[target], sameUser);
            });
        });
    }
};

const addRep = (bot, message) => {
    updateRep(message, true, (err, user, rank, sameUser) => {
        if (!err) {
            if (sameUser) {
                bot.reply(message, `${user}'s rep decreased to ${rank}`);
            }
            else {
                bot.reply(message, `${user}'s rep increased to ${rank}`);
            }
        }
    });
};

const subtractRep = (bot, message) => {
    updateRep(message, false, (err, user, rank) => {
        if (!err) {
            bot.reply(message, `${user}'s rep decreased to ${rank}`);
        }
    });
};

const showRanks = (bot, message) => {
    const sortable = [];
    getRanks(stored => {
        for (const key in stored) {
            sortable.push([key, stored[key]]);
        }
        sortable.sort((a, b) => b[1] - a[1]);
        for (const entry of sortable) {
            bot.reply(message, `${entry[0]}: ${entry[1]}`);
        }
    });
};

module.exports = {
    addRep,
    subtractRep,
    showRanks
};