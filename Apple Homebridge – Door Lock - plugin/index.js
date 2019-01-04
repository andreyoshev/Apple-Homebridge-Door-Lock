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
    this.cachedLockState = false;
}

LockAccessory.prototype.setState = function(state, callback) {

    var lockState = "unlock";

    this.log("Set state to %s", lockState);

    var currentState = Characteristic.LockTargetState.UNSECURED

    //this is a security latch that can't be unlocked programatically
    if (lockState == "unlock") {
        this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
        callback(null); // success
        return;
    }

    request.post({
        url: this.url
    }, function(err, response, body) {
//         this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
//         this.cachedLockState = true;
        callback(null); // success
    }.bind(this));
},
    
LockAccessory.prototype.getServices = function() {
    return [];
}
