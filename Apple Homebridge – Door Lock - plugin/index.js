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
    
//     //start the 5 second check loop
//     this.checkState();
}

LockAccessory.prototype.getState = function(callback) {
    callback(null, true);
}

LockAccessory.prototype.checkState = function() {
    var self = this;
    self.cachedLockState = true;
    var currentState = Characteristic.LockCurrentState.SECURED
    self.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
    self.lockservice.setCharacteristic(Characteristic.LockTargetState, currentState);
}

LockAccessory.prototype.setState = function(state, callback) { 
    
    var lockState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";

    this.log("Set state to %s", lockState);

    var currentState = (state == Characteristic.LockTargetState.SECURED) ?
        Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;

    this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
    
    request.post({
        url: this.url
    }, function(err, response, body) {
        this.log("response");
    }.bind(this));
    
    callback(null); // success
},

LockAccessory.prototype.getServices = function() {
    return [this.lockservice];
}
