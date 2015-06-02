(function (argument) {
'use strict';

// This class derives the UUIDs of a service's characteristics from the UUID of
// the service, using the pattern shown in
// http://processors.wiki.ti.com/index.php/SensorTag_User_Guide#SensorTag_Software.
function SensortagSensorBase(polymerObject, fieldName) {
  this._polymerObject = polymerObject;
  this._fieldNameDot = fieldName + '.';

  this.service = null;
  // The following are non-null if this.service is non-null;
  this.data = null;  // BluetoothCharacteristic
  this.configuration = null; // BluetoothCharacteristic
  this.period = null; // BluetoothCharacteristic

  this.loaded = false;
};
window.SensortagSensorBase = SensortagSensorBase;

SensortagSensorBase.prototype = {
  set: function(path, value) {
    this._polymerObject.set(this._fieldNameDot + path, value);
  },

  clearService: function() {
    if (!this.service) {
      return;
    }

    this.set('loaded', false);

    this.data.stopNotifications().catch(window.onerror);
    Sensortag.dispatch.delete(this.data.instanceId);
    this.configuration.writeValue(Sensortag.configurationDisable).catch(window.onerror);
    this.set('service', null);
    this.set('data', null);
    this.set('configuration', null);
    this.set('period', null);
  },

  setService: function(newService) {
    var self = this;
    if (self.service) {
      self.clearService();
    }
    if (!newService) {
      return Promise.resolve();
    }
    var dataUuid = self._replaceAt(newService.uuid, 7, '1');
    var configurationUuid = self._replaceAt(newService.uuid, 7, '2');
    var periodUuid = self._replaceAt(newService.uuid, 7, '3');
    var data, configuration, period;

    return newService.getAllCharacteristics(
    ).then(function(characteristics) {
      data = Sensortag.findUuid(characteristics, dataUuid);
      configuration = Sensortag.findUuid(characteristics, configurationUuid);
      period = Sensortag.findUuid(characteristics, periodUuid);
      return Promise.all([
        data.startNotifications(),
        configuration.writeValue(Sensortag.configurationEnable)
      ]);
    }).then(function() {
      self.set('service', newService);
      self.set('data', data);
      Sensortag.dispatch.set(data.instanceId, self);
      self.set('configuration', configuration);
      self.set('period', period);
      self.data.readValue();
      // Let the global valueChanged handler deal with calling characteristicValueChanged().
    }).catch(function(e) { window.onerror(e); });
  },

  characteristicValueChanged: function(characteristic) {
    if (this.data.instanceId !== characteristic.instanceId) {
      window.onerror('Notified of a change in ', characteristic,
                     'which isn\'t associated with this object:', this);
      return;
    }
    this.dataChanged(characteristic.value);
    this.set('loaded', true);
  },

  // Override this to parse the new data value.
  dataChanged: function(newValue) {},

  _replaceAt: function(string, index, newString) {
    return string.slice(0, index) + newString + string.slice(index+1);
  },
};

})();
