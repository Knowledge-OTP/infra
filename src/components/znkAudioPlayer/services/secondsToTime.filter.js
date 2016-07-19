(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').filter('secondsToTime', [
        function () {
            return function (totalSeconds,format) {
                var min = parseInt(totalSeconds / 60);
                var paddedMin = min >= 10 ? min : '0' + min;
                var sec = parseInt(totalSeconds % 60);
                var paddedSec = sec >= 10 ? sec: '0' + sec;
                return format.replace('mm',paddedMin)
                    .replace('m',min)
                    .replace('ss',paddedSec)
                    .replace('s',sec);
            };
        }
    ]);
})(angular);
