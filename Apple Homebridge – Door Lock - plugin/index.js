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
    
    this.lockservice.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
    
    request.post({
        url: this.url
    }, function(err, response, body) {
            console.log("Open");
        
            var temoState = Characteristic.LockCurrentState.UNSECURED
            this.lockservice.setCharacteristic(Characteristic.LockCurrentState, temoState);
            this.lockservice.setCharacteristic(Characteristic.LockTargetState, temoState);   
        
            var currentState = Characteristic.LockCurrentState.SECURED
            this.lockservice.setCharacteristic(Characteristic.LockCurrentState, currentState);
            this.lockservice.setCharacteristic(Characteristic.LockTargetState, currentState);  
        
            callback(null); // success
    }.bind(this));
},

LockAccessory.prototype.getServices = function() {
    return [this.lockservice];
}
