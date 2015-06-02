(function() {
"use strict";

chrome = chrome || {};

function BluetoothDevice(config) {
  this.connected = false;
  this.address = config.address;
  this.name = config.name;
  this.uuids = config.uuids;
};

var devices = [
  new BluetoothDevice({
    address: "12345",
    name: "Fake Device",
    uuids: ["f000aa00-0451-4000-b000-000000000000",
            "f000aa10-0451-4000-b000-000000000000",
            "f000aa20-0451-4000-b000-000000000000"],
  }),
  new BluetoothDevice({
    address: "54321",
    name: "Fake Device 2",
    uuids: ["f000aa00-0451-4000-b000-000000000000",
            "f000aa10-0451-4000-b000-000000000000",
            "f000aa20-0451-4000-b000-000000000000"],
  }),
];

chrome.bluetooth = {
  getDevices: function(callback) {
    Promise.resolve().then(function() { callback(devices); });
  },
  startDiscovery: function(callback) {
    Promise.resolve().then(callback);
  },
  stopDiscovery: function(callback) {
    Promise.resolve().then(callback);
  },
  onDeviceAdded: {
    listeners: [],
    addListener: function(listener) {
      this.listeners.push(listener);
    },
    removeListener: function(listener) {
      this.listeners = this.listeners.filter(function(l) { return l !== listener; });
    },
  },
  onDeviceChanged: {
    listeners: [],
    addListener: function(listener) {
      this.listeners.push(listener);
    },
    removeListener: function(listener) {
      this.listeners = this.listeners.filter(function(l) { return l !== listener; });
    },
  },
  onDeviceRemoved: {
    listeners: [],
    addListener: function(listener) {
      this.listeners.push(listener);
    },
    removeListener: function(listener) {
      this.listeners = this.listeners.filter(function(l) { return l !== listener; });
    },
  },
};
chrome.bluetoothLowEnergy = {
  connect: function(address, options, callback) {
    callback();
  },
  onCharacteristicValueChanged: {
    listeners: [],
    addListener: function(listener) {
      this.listeners.push(listener);
    },
    removeListener: function(listener) {
      this.listeners = this.listeners.filter(function(l) { return l !== listener; });
    },
  },
};
chrome.runtime.getManifest = function() {
  return {name: "Fake Origin"};
};

})();
