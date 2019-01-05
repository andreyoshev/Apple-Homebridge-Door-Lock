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

    this.battservice = new Service.BatteryService(this.name);
    
    //start the 5 second check loop
    this.checkState();
}

LockAccessory.prototype.getState = function(callback) {
    callback(null, true);
}

LockAccessory.prototype.checkState = function() {
    var self = this;
    this.getState(function(err, state){
        if (self.cachedLockState !== state) {
            self.cachedLockState = state;
            var currentState = Characteristic.LockCurrentState.SECURED
            self.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
            self.lockservice.setCharacteristic(Characteristic.LockTargetState, currentState);
        }

        setTimeout(self.checkState.bind(self), 8000);
    })
}

LockAccessory.prototype.setState = function(state, callback) {
    
    this.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    
    request.post({
        url: this.url
    }, function(err, response, body) {
        if (!err && response.statusCode == 200) {
            this.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
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
    return [this.lockservice];
}
