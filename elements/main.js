(function() {
'use strict';

new SensortagTemperature();

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
  bluetoothEnabled: false,

  created: function() {
    this.deviceMap = new Map();  // Call deviceMapChanged manually when this changes.
    this.deviceList = [];  // List of bluetooth.Devices. Used in the UI.

    this.temperature = new SensortagTemperature();
    this.accelerometer = new SensortagAccelerometer();
    this.humidity = new SensortagHumidity();
  },

  attached: function() {
    this.selectedDeviceAddressChanged();
  },
  detached: function() {
    // If this element is removed from the DOM, stop getting Bluetooth notifications.
    this.selectedDevice = null;
  },

  ready: function() {
    var self = this;

    window.onerror = function(e) {
      self.error(e);
    };

    // Let the UI track whether Bluetooth is enabled
    chrome.bluetooth.onAdapterStateChanged.addListener(function(adapter) {
      self.bluetoothEnabled = adapter.enabled;
    });
    chrome.bluetooth.getAdapterState(function(adapter) {
      self.bluetoothEnabled = adapter.enabled;
    });

    // Initialize the device map.
    chrome.bluetooth.getDevices(function (devices) {
      if (chrome.runtime.lastError) {
        self.error(chrome.runtime.lastError.message);
        return;
      }

      if (devices) {
        devices.forEach(function (device) {
          // See if the device exposes a TI service.
          var services = device.uuids.filter(function (service) {
            return supportedServices.has(service);
          });

          if (services.length)
            self.storeDevice(device.address, device);
        });
      }
    });
  },

  error: function(message) {
    console.error(message, message.stack);
    this.$.error.text = 'Error: ' + message;
    this.$.error.show();
  },

  scanBluetooth: function() {

  },

  storeDevice: function(deviceAddress, device) {
    if (device == null) {
      this.deviceMap.delete(deviceAddress);
    } else {
      this.deviceMap.set(deviceAddress, device);
    }
    this.deviceMapChanged();
  },

  deviceMapChanged: function() {
    this.deviceList = [];
    for (var device of this.deviceMap.values())
      this.deviceList.push(device);
    this.deviceList.sort(function(a, b) {
      return a.name.compare(b.name);
    });
    if (!this.selectedDeviceAddress && this.deviceList.length > 0) {
      this.selectedDeviceAddress = this.deviceList[0].address;
    }
  },

  selectedDeviceAddressChanged: function() {
    var self = this;
    if (!self.selectedDeviceAddress) {
      self.selectedDevice = null;
    } else {
      var origSelectedAddress = self.selectedDeviceAddress;
      navigator.bluetooth.getDevice(origSelectedAddress
        ).then(function(device) {
          if (self.selectedDeviceAddress === origSelectedAddress) {
            self.selectedDevice = device;
          }
        }).catch(window.onerror);
    }
  },

  selectedDeviceChanged: function() {
    var self = this;
    self.temperature.clearService();
    self.accelerometer.clearService();
    self.humidity.clearService();
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
