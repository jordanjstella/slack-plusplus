module.exports = class {
    static getTarget(input, users) {
        const userMatch = this.getUserMatch(input);
        if (!!userMatch) {
            return users[userMatch[1]];
        }
        return input.replace('@', '');
    }

    static getUserId(input) {
        const userMatch = this.getUserMatch(input);
        if (!!userMatch) {
            return userMatch[1];
        }
        return null;
    }

    static isValid(input) {
        return input.length === 2 && !!input[1].match(/\+{2}|-{2}/);
    }

    static getUserMatch(input) {
        return input.match(/(?:<@)(.*?)(?:>)/);
    }
};