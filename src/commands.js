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

const getRanks = () => {
    return new Promise((resolve, reject) => {
        jsonfile.readFile(storageFile, (err, stored) => {
            if (!err) {
                resolve(stored);
            }
            else {
                reject(err);
            }
        });
    });
}

const updateRanks = obj => {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(storageFile, obj, err => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};

const updateRep = (message, add) => {
    const text = message.text.split(' ');

    const target = InputParser.getTarget(text[0], users),
        sameUser = InputParser.getUserId(text[0]) === message.user
            || target.toLowerCase() === users[message.user];

    return new Promise((resolve, reject) => {
        getRanks().then(stored => {
            if (stored[target] === undefined) {
                stored[target] = 0;
            }
            if (add && !sameUser) {
                stored[target] = stored[target] + 1;
            }
            else {
                stored[target] = stored[target] - 1;
            }
            updateRanks(stored).then(() => {
                resolve({ user: target, rank: stored[target], sameUser: sameUser });
            }).catch(err => {
                reject(err);
            });
        }).catch(err => {
            reject(err)
        });
    });
};

const addRep = (bot, message) => {
    if (InputParser.isValid(message.text.split(' '))) {
        updateRep(message, true).then(updated => {
            if (updated.sameUser) {
                bot.reply(message, `${updated.user}'s rep decreased to ${updated.rank}`);
            }
            else {
                bot.reply(message, `${updated.user}'s rep increased to ${updated.rank}`);
            }
        });
    }
};

const subtractRep = (bot, message) => {
    if (InputParser.isValid(message.text.split(' '))) {
        updateRep(message, false).then(updated => {
            bot.reply(message, `${updated.user}'s rep decreased to ${updated.rank}`);
        });
    }
};

const showRanks = (bot, message) => {
    const sortable = [];
    getRanks().then(stored => {
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