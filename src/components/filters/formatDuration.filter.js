(function (angular) {
    'use strict';
    /**
     * @param time (in seconds)
     * @param exp (expression to display time)
     * @param showIn2digits - always show time hours, minutes and seconds in 2 digits, for example 1 minute and 1 second will display as 01:01 instead of 1:1 (depends on the passed expression)
     * @returns formatted time string
     */
    angular.module('znk.infra.filters').filter('formatDuration', ['$log', function ($log) {
        return function (time, exp, showIn2digits) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }
            var t = Math.round(parseInt(time));
            var hours = parseInt(t / 3600, 10);
            t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10);
            var seconds = time % 60;
            var defaultFormat = 'mm:ss';

            if (!exp) {
                exp = defaultFormat;
            }

            if (showIn2digits) {
                seconds = (seconds < 10) ? '0' + seconds : seconds;
                minutes = (minutes < 10) ? '0' + minutes : minutes;
                hours = (hours < 10) ? '0' + hours : hours;
            }

            return exp.replace(/hh/g, hours).replace(/mm/g, minutes).replace(/ss/g, seconds);
        };
    }]);
})(angular);
