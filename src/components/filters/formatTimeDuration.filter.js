(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('formatTimeDuration', ['$log', function ($log) {
            return function (time, exp) {
                if (!angular.isNumber(time) || isNaN(time)) {
                    $log.error('time is not a number:', time);
                    return '';
                }
                var t = Math.round(parseInt(time));
                var hours = parseInt(t / 3600000, 10);
                var minutes = parseInt(t / 60000, 10);
                var seconds = time / 1000;
                var defaultFormat = 'mm';

                if (!exp) {
                    exp = defaultFormat;
                }
                return exp.replace(/hh/g, hours).replace(/mm/g, minutes).replace(/ss/g, seconds);
            };
        }]);
})(angular);
