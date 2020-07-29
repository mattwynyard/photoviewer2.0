'use strict'

let users = [];

let findUserToken = (token, name) => {
    const result = users.find(user => user.token === token);
    if (result === undefined) {
        //console.log("token not found");
        return false;
    }
    if (result.name === name) {
        //console.log("found token");
        return true;
    } else {
       // console.log("user not found");
        return false;
    }
};

let addUser = (user) => {
    users.push(user);   
};

let deleteToken = (token) => {
    users.splice(users.indexOf(token), 1);   
};

let printUsers = () => {
    console.log(users);
}

exports.printUsers = printUsers;
exports.addUser = addUser;
exports.deleteToken = deleteToken;
exports.findUserToken = findUserToken;