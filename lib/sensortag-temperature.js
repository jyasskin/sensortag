(function (argument) {
'use strict';

function SensortagTemperature() {
  SensortagSensorBase.apply(this, arguments);
};
window.SensortagTemperature = SensortagTemperature;

SensortagTemperature.prototype = {
  __proto__: SensortagSensorBase.prototype,

  objectTemperature: 0/0,
  ambientTemperature: 0/0,

  dataChanged: function(newValue) {
    var view = new DataView(newValue);
    var objectRawTemperature = view.getUint16(0, true);
    var ambientRawTemperature = view.getUint16(2, true);

    // Algorithms from http://processors.wiki.ti.com/index.php/SensorTag_User_Guide#SensorTag_Software
    // Conversion algorithm for die temperature [°F]
    this.set('ambientTemperature', ambientRawTemperature/128);

    // Calculate target temperature [°F]
    var Vobj2 = objectRawTemperature;
    Vobj2 *= 0.00000015625;

    var Tdie2 = this.ambientTemperature + 273.15;
    var S0 = 6.4E-14;            // Calibration factor

    var a1 = 1.75E-3;
    var a2 = -1.678E-5;
    var b0 = -2.94E-5;
    var b1 = -5.7E-7;
    var b2 = 4.63E-9;
    var c2 = 13.4;
    var Tref = 298.15;
    var S = S0*(1+a1*(Tdie2 - Tref)+a2*Math.pow((Tdie2 - Tref),2));
    var Vos = b0 + b1*(Tdie2 - Tref) + b2*Math.pow((Tdie2 - Tref),2);
    var fObj = (Vobj2 - Vos) + c2*Math.pow((Vobj2 - Vos),2);
    var tObj = Math.pow(Math.pow(Tdie2,4) + (fObj/S),.25);
    this.set('objectTemperature', tObj - 273.15);
  },
};

})();
