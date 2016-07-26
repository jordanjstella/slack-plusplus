const request = require('request'),
    jsonfile = require('jsonfile'),
    token = require('./config/config').token,
    services = require('./services'),
    storageFile = require('path').resolve(__dirname, 'data/rankings.json'),
    users = {};

request(services.slackUsers(token), (err, response, body) => {
    const members = JSON.parse(body).members;
    for (const member of members) {
        users[member.id] = member.name;
    }
    console.log(`${Object.keys(users).length} Users Found`);
});

const isValid = text => text.length === 2 && !!text[0].match(/^<@.*>:?$/);

const getRanks = cb => {
    jsonfile.readFile(storageFile, (err, stored) => {
        cb(stored);
    });
}

const updateRanks = (obj, cb) => {
    jsonfile.writeFile(storageFile, obj, cb);
};

const updateRep = (message, add, cb) => {
    const text = message.text.split(' '),
        userMatch = text[0].match(/(?:<@)(.*?)(?:>)/);
    let userID;

    if(!!userMatch) {
        userID = userMatch[1]; 
    }
    if (isValid(text) && !!users[userID]) {
        const user = users[userID];
        getRanks(stored => {
            if (stored[user] === undefined) {
                stored[user] = 0;
            }
            if (add) {
                stored[user] = stored[user] + 1;
            }
            else {
                stored[user] = stored[user] - 1;
            }
            updateRanks(stored, err => {
                cb(err, user, stored[user]);
            });
        });
    }
};

const addRep = (bot, message) => {
    updateRep(message, true, (err, user, rank) => {
        if (!err) {
            bot.reply(message, `${user}'s rep increased to ${rank}`);
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
        for(const key in stored) {
            sortable.push([key, stored[key]]);
        }
        sortable.sort((a, b) => a[1] - b[1]);
        for(const entry of sortable) {
            bot.reply(message, `${entry[0]}: ${entry[1]} rep`);
        }
    });
};



module.exports = {
    addRep,
    subtractRep,
    showRanks
};