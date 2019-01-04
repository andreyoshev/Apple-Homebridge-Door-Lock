var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("Homebridge – Door Lock", "HTTPLock", LockAccessory);
}

function LockAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.url = config["url"];
    this.lockID = config["lock-id"];
    this.username = config["username"];
    this.password = config["password"];
    this.cachedLockState = false;
}

LockAccessory.prototype.getState = function(callback) {
    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            callback(null, true); // success
        }
        else {
            this.log("Error getting state (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.checkState = function() {
    var self = this;
    this.getState(function(err, state){
        if (self.cachedLockState !== state) {
            self.cachedLockState = state;
            var currentState = (state == true) ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.SECURED
            self.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
            self.lockservice.setCharacteristic(Characteristic.LockTargetState, currentState);
        }

        setTimeout(self.checkState.bind(self), 8000);
    })
}

LockAccessory.prototype.getBattery = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            callback(null, ""); // success
        }
        else {
            this.log("Error getting battery (status code %s): %s", response.statusCode, err);
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.getCharging = function(callback) {
    callback(null, Characteristic.ChargingState.NOT_CHARGING);
}

LockAccessory.prototype.getLowBatt = function(callback) {
    this.log("Getting current battery...");

    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            callback(null, ""); // success
        }
        else {
            var errCode = "NO RESPONSE"
            if (response) errCode = response.statusCode
            this.log("Error getting battery (status code %s): %s", errCode, err);
            callback(err);
        }
    }.bind(this));
}

LockAccessory.prototype.setState = function(state, callback) {

    var lockState = (state == Characteristic.LockTargetState.SECURED) ? "unlock" : "unlock";

    this.log("Set state to %s", lockState);

    var currentState = (state == Characteristic.LockTargetState.SECURED) ?
        Characteristic.LockCurrentState.UNSECURED : Characteristic.LockCurrentState.UNSECURED;

    //this is a security latch that can't be unlocked programatically
    if (lockState == "unlock") {
        this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
        callback(null); // success
        return;
    }

    request.post({
        url: this.url
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
            // this.cachedLockState = true;
            callback(null); // success
        }
        else {
            this.log("Error '%s' setting lock state. Response: %s", err, body);
            callback(err || new Error("Error setting lock state."));
        }
    }.bind(this));
},
