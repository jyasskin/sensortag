(function (argument) {
'use strict';

var Sensortag = window.Sensortag = {};

Sensortag.uuid = {};
// Derived from http://processors.wiki.ti.com/index.php/SensorTag_User_Guide#SensorTag_Software
Sensortag.uuid.base = 'f0000000-0451-4000-b000-000000000000';

function ti_uuid(uuid16) {
  return 'f000' + uuid16 + '-0451-4000-b000-000000000000';
};

Sensortag.uuid.temperature = ti_uuid('aa00');
Sensortag.uuid.temperatureData = ti_uuid('aa01');
Sensortag.uuid.temperatureConfiguration = ti_uuid('aa02');
Sensortag.uuid.temperaturePeriod = ti_uuid('aa03');

Sensortag.uuid.accelerometer = ti_uuid('aa10');
Sensortag.uuid.accelerometerData = ti_uuid('aa11');
Sensortag.uuid.accelerometerConfiguration = ti_uuid('aa12');
Sensortag.uuid.accelerometerPeriod = ti_uuid('aa13');

Sensortag.uuid.humidity = ti_uuid('aa20');
Sensortag.uuid.humidityData = ti_uuid('aa21');
Sensortag.uuid.humidityConfiguration = ti_uuid('aa22');
Sensortag.uuid.humidityPeriod = ti_uuid('aa23');

Sensortag.configurationEnable = new Uint8Array([0x01]).buffer;
Sensortag.configurationDisable = new Uint8Array([0x00]).buffer;

Sensortag.findUuid = function(array, uuid) {
  for (var elem of array) {
    if (elem.uuid === uuid) {
      return elem;
    }
  }
  return undefined;
}

})();
