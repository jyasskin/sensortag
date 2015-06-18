(function() {
"use strict";

function bytesEqual(buf1, buf2) {
  if (buf1.byteLength != buf2.byteLength) {
    return false;
  }
  buf1 = new UInt8Array(buf1);
  buf2 = new UInt8Array(buf2);
  for (var i = 0; i < buf1.byteLength; ++i) {
    if (buf1[i] !== buf2[i])
      return false;
  }
  return true;
}

if (!BluetoothGATTCharacteristic.writeValue) {
  BluetoothGATTCharacteristic.writeValue = function(value) {
    console.error(this, '.writeValue(', value, ') isn\'t supported yet.');
  };
}


function mixinEventTarget(ctor) {
  if (ctor.prototype.addEventListener)
    return;
  ctor.prototype.addEventListener = function(type, func, useCapture) {
    if (this.__listeners === undefined) {
      this.__listeners = [];
    }
    this.__listeners.push({type: type, func: func, useCapture: useCapture});
  };
}

mixinEventTarget(navigator.bluetooth);
mixinEventTarget(BluetoothGATTService);
mixinEventTarget(BluetoothGATTCharacteristic);

if (!BluetoothGATTCharacteristic.startNotifications) {
  BluetoothGATTCharacteristic.startNotifications = function() {
    var self = this;
    console.log(this, '.startNotifications() is being polyfilled.');
    setInterval(function() {
      var oldValue = self.value;
      self.readValue().then(function(newValue) {
        if (!bytesEqual(oldValue, newValue)) {
          var event = {
            type: 'characteristicvaluechanged',
            target: self,
          };
          var path = [self, self.service, self.service.device, navigator.bluetooth];
          for (var elem of path) {
            for (var listener of elem.__listeners) {
              if (listener.type === 'characteristicvaluechanged') {
                listener.func(e);
              }
            }
          }
        }
      });
    }, 5000);
  };
}

})();
