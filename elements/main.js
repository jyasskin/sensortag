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
    console.error(message);
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
    this.selectedDevice = this.deviceMap.get(this.selectedDeviceAddress);
  },

  selectedDeviceChanged: function () {
    var self = this;
    self.temperature.clearService();
    self.accelerometer.clearService();
    self.humidity.clearService();
    chrome.bluetoothLowEnergy.getServices(self.selectedDevice.address, function(services) {
      if (chrome.runtime.lastError) {
        window.onerror(chrome.runtime.lastError.message);
        return;
      }
      self.temperature.setService(Sensortag.findUuid(services, Sensortag.uuid.temperature));
      self.accelerometer.setService(Sensortag.findUuid(services, Sensortag.uuid.accelerometer));
      self.humidity.setService(Sensortag.findUuid(services, Sensortag.uuid.humidity));
    })
  }
});

// Maps an instanceId to the object to fire events on.
Sensortag.dispatch = new Map();
chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(function(characteristic) {
  var target = Sensortag.dispatch.get(characteristic.instanceId);
  if (target) {
    target.characteristicValueChanged(characteristic);
  }
});

PolymerExpressions.prototype.toFixed = function(value, precision) {
  return (+value).toFixed(precision);
};

function skip() {
  function DeviceInfoDemo() {
    // A mapping from device addresses to device names for found devices that
    // expose a Battery service.
    this.deviceMap_ = {};

    // The currently selected service and its characteristics.
    this.service_ = null;
    this.chrcMap_ = {};
  }

  /**
   * Sets up the UI for the given service.
   */
  function selectService(service) {
    // Hide or show the appropriate elements based on whether or not
    // |serviceId| is undefined.
    UI.getInstance().resetState(!service);

    this.service_ = service;
    this.chrcMap_ = {};

    if (!service) {
      console.log('No service selected.');
      return;
    }

    console.log('GATT service selected: ' + service.instanceId);

    // Get the characteristics of the selected service.
    var self = this;
    chrome.bluetoothLowEnergy.getCharacteristics(service.instanceId,
                                                 function (chrcs) {
      if (chrome.runtime.lastError) {
        console.log(chrome.runtime.lastError.message);
        return;
      }

      // Make sure that the same service is still selected.
      if (service.instanceId != self.service_.instanceId)
        return;

      if (chrcs.length == 0) {
        console.log('Service has no characteristics: ' + service.instanceId);
        return;
      }

      chrcs.forEach(function (chrc) {
        var fieldId;
        var valueDisplayFunction = UI.getInstance().setStringValue;

        if (chrc.uuid == MANUFACTURER_NAME_STRING_UUID) {
          console.log('Setting Manufacturer Name String Characteristic: ' +
                      chrc.instanceId);
          fieldId = 'manufacturer-name-string';
        } else if (chrc.uuid == SERIAL_NUMBER_STRING_UUID) {
          console.log('Setting Serial Number String Characteristic: ' +
                      chrc.instanceId);
          fieldId = 'serial-number-string';
        } else if (chrc.uuid == HARDWARE_REVISION_STRING_UUID) {
          console.log('Setting Hardware Revision String Characteristic: ' +
                      chrc.instanceId);
          fieldId = 'hardware-revision-string';
        } else if (chrc.uuid == FIRMWARE_REVISION_STRING_UUID) {
          console.log('Setting Firmware Revision String Characteristic: ' +
                      chrc.instanceId);
          fieldId = 'firmware-revision-string';
        } else if (chrc.uuid == SOFTWARE_REVISION_STRING_UUID) {
          console.log('Setting Software Revision String Characteristic: ' +
                      chrc.instanceId);
          fieldId = 'software-revision-string';
        } else if (chrc.uuid == PNP_ID_UUID) {
          console.log('Setting PnP ID Characteristic: ' + chrc.instanceId);
          fieldId = 'pnp-id';
          valueDisplayFunction = UI.getInstance().setPnpIdValue;
        }

        if (fieldId === undefined) {
          console.log('Ignoring characteristic "' + chrc.instanceId +
                      '" with UUID ' + chrc.uuid);
          return;
        }

        self.chrcMap_[fieldId] = chrc;

        // Read the value of the characteristic and store it.
        chrome.bluetoothLowEnergy.readCharacteristicValue(chrc.instanceId,
                                                          function (readChrc) {
          if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
            return;
          }

          // Make sure that the same characteristic is still selected.
          if (!self.chrcMap_.hasOwnProperty(fieldId) ||
              self.chrcMap_[fieldId].instanceId != readChrc.instanceId)
            return;

          self.chrcMap_[fieldId] = readChrc;
          valueDisplayFunction(fieldId, readChrc.value);
        });
      });
    });
  };

  DeviceInfoDemo.prototype.init = function() {
    // Set up the UI to look like no device was initially selected.
    this.selectService(null);

    // Request information about the local Bluetooth adapter to be displayed in
    // the UI.
    var updateAdapterState = function(adapterState) {
      UI.getInstance().setAdapterState(adapterState.address, adapterState.name);
    };

    chrome.bluetooth.getAdapterState(function (adapterState) {
      if (chrome.runtime.lastError)
        console.log(chrome.runtime.lastError.message);

      updateAdapterState(adapterState);
    });

    chrome.bluetooth.onAdapterStateChanged.addListener(updateAdapterState);

    // Store the |this| to be used by API callbacks below.
    var self = this;

    // Helper functions used below.
    var isKnownDevice = function(deviceAddress) {
      return self.deviceMap_.hasOwnProperty(deviceAddress);
    };




    // Set up the device selector.
    UI.getInstance().setDeviceSelectionHandler(function(selectedValue) {
      // If |selectedValue| is empty, unselect everything.
      if (!selectedValue) {
        self.selectService(null);
        return;
      }

      // Request all GATT services of the selected device to see if it still has
      // a Device Information service and pick the first one to display.
      chrome.bluetoothLowEnergy.getServices(selectedValue, function (services) {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          self.selectService(null);
          return;
        }

        var foundService = null;
        services.forEach(function (service) {
          if (service.uuid == DEVICE_INFO_SERVICE_UUID)
            foundService = service;
        });

        self.selectService(foundService);
      });
    });

  };
}

})();
