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

    this.lockservice = new Service.LockMechanism(this.name);

    this.lockservice
        .getCharacteristic(Characteristic.LockCurrentState)
        .on('get', this.getState.bind(this));

    this.lockservice
        .getCharacteristic(Characteristic.LockTargetState)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));

    this.battservice = new Service.BatteryService(this.name);

    this.battservice
        .getCharacteristic(Characteristic.BatteryLevel)
        .on('get', this.getBattery.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.ChargingState)
        .on('get', this.getCharging.bind(this));

    this.battservice
        .getCharacteristic(Characteristic.StatusLowBattery)
        .on('get', this.getLowBatt.bind(this));


    //start the 5 second check loop
    this.checkState();
}

LockAccessory.prototype.getState = function(callback) {
    request.get({
        url: this.url,
        qs: { username: this.username, password: this.password, lockid: this.lockID }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {

            var locked = "unlocked"
                callback(null, locked); // success
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
            var currentState = (state == true) ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED
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
            
            callback(null, "100%"); // success
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

    var lockState = "unlock"

    this.log("Set state to %s", lockState);

    var currentState = Characteristic.LockCurrentState.SECURED;

    //this is a security latch that can't be unlocked programatically
    if (lockState == "unlock") {
        this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
        callback(null); // success
        return;
    }

    request.post({
        url: this.url,
        form: { username: this.username, password: this.password, lockid: this.lockID, state: lockState }
    }, function(err, response, body) {

        if (!err && response.statusCode == 200) {
            // this.lockservice
            //     .setCharacteristic(Characteristic.LockCurrentState, currentState);
            // this.cachedLockState = true;
            callback(null); // success
        }
        else {
            this.log("Error '%s' setting lock state. Response: %s", err, body);
            callback(err || new Error("Error setting lock state."));
        }
    }.bind(this));
},

LockAccessory.prototype.getServices = function() {
    return [this.lockservice, this.battservice];
}
