(function (argument) {
'use strict';

function SensortagAccelerometer() {
  SensortagSensorBase.call(this);
};
window.SensortagAccelerometer = SensortagAccelerometer;

SensortagAccelerometer.prototype = {
  __proto__: SensortagSensorBase.prototype,

  // Accelerations in g's.
  x: 0,
  y: 0,
  z: 0,

  dataChanged: function(newValue) {
    var view = new DataView(newValue);
    var rawX = view.getInt8(0);
    var rawY = view.getInt8(1);
    var rawZ = view.getInt8(2);

    this.x = rawX / 16.0;
    this.y = rawY / 16.0;
    this.z = rawZ / 16.0;
  },
};

})();
