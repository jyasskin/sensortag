(function() {
'use strict';

// GATT Device Information Service UUIDs
var DEVICE_INFO_SERVICE_UUID      = '0000180a-0000-1000-8000-00805f9b34fb';
var MANUFACTURER_NAME_STRING_UUID = '00002a29-0000-1000-8000-00805f9b34fb';
var SERIAL_NUMBER_STRING_UUID     = '00002a25-0000-1000-8000-00805f9b34fb';
var HARDWARE_REVISION_STRING_UUID = '00002a27-0000-1000-8000-00805f9b34fb';
var FIRMWARE_REVISION_STRING_UUID = '00002a26-0000-1000-8000-00805f9b34fb';
var SOFTWARE_REVISION_STRING_UUID = '00002a28-0000-1000-8000-00805f9b34fb';
var PNP_ID_UUID                   = '00002a50-0000-1000-8000-00805f9b34fb';


var supportedServices = new Set([
  Sensortag.uuid.temperature,
  Sensortag.uuid.accelerometer,
  Sensortag.uuid.humidity
]);

Polymer('sensortag-main', {
  bluetoothState: 'bluetooth-searching',

  created: function() {
    this.selectedDevice = null;

    this.temperature = new SensortagTemperature();
    this.accelerometer = new SensortagAccelerometer();
    this.humidity = new SensortagHumidity();
  },

  ready: function() {
    var self = this;

    window.onerror = function(e) {
      self.error(e);
    };
  },

  error: function(message) {
    console.error(message, message.stack);
    this.$.error.text = 'Error: ' + message;
    this.$.error.show();
  },

  scanBluetooth: function() {
    var self = this;
    self.bluetoothState = 'bluetooth-searching';
    navigator.bluetooth.requestDevice([{
      services: [
        Sensortag.uuid.temperature,
        Sensortag.uuid.accelerometer,
        Sensortag.uuid.humidity,
      ],
    }], {
      optionalServices: [],
    }).then(function(device) {
      self.connectingDevice = device;
      var connected = Promise.resolve();
      if (!device.connected) {
        connected = device.connect();
      }
      connected.then(function() {
        self.selectedDevice = device;
      }).catch(function(error) {
        if (error) {
          self.error(error);
        } else {
          self.error('Could not connect to "' + device.name +
                     '" (' + device.address + ')')
        }
      }).then(function() {
        self.connectingDevice = null;
      });
    }, function(error) {
      self.bluetoothState =
          self.selectedDevice ? 'bluetooth-connected' : 'bluetooth';
      if (error) {
        console.error(error);
      }
    });
  },

  disconnect: function() {
    var self = this;
    if (self.selectedDevice) {
      self.selectedDevice.disconnect().catch(window.onerror);
      self.selectedDevice = null;
    }
  },

  selectedDeviceChanged: function() {
    var self = this;
    self.temperature.clearService();
    self.accelerometer.clearService();
    self.humidity.clearService();
    if (self.selectedDevice) {
      self.bluetoothState = 'bluetooth-connected';
      Promise.all([
        self.selectedDevice.getService(Sensortag.uuid.temperature).then(function(service) {
          self.temperature.setService(service);
        }),
        self.selectedDevice.getService(Sensortag.uuid.accelerometer).then(function(service) {
          self.accelerometer.setService(service);
        }),
        self.selectedDevice.getService(Sensortag.uuid.humidity).then(function(service) {
          self.humidity.setService(service);
        }),
      ]).catch(window.onerror);
    } else {
      self.bluetoothState = 'bluetooth';
    }
  },
});

// Maps an instanceId to the object to fire events on.
Sensortag.dispatch = new Map();
navigator.bluetooth.addEventListener('characteristicvaluechanged', function(e) {
  var characteristic = e.target;
  var target = Sensortag.dispatch.get(characteristic.instanceId);
  if (target) {
    target.characteristicValueChanged(characteristic);
  }
});

PolymerExpressions.prototype.toFixed = function(value, precision) {
  return (+value).toFixed(precision);
};

})();
