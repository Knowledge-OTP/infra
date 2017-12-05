(function (angular) {
    'use strict';
    /**
     * @param time (in seconds)
     * @param exp (expression to display time)
     *      'ss' - seconds in hour (1-59)
     *      'SS' - padded seconds in hour (01-59)
     *      'mm' - minutes in hour (1)
     *      'MM' - padded minutes in hour (01-59)
     *      'hh' - hours (1, 2, 3 etc')
     *      'HH' - padded hours - (01, 02, 03 etc')
     * @returns formatted time string
     */
    angular.module('znk.infra.filters').filter('formatDuration', function ($log) {
        'ngInject';
        return function (time, exp) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }
            var t = Math.round(parseInt(time));
            var hours = parseInt(t / 3600, 10);
            var paddedHours = (hours < 10) ? '0' + hours : hours;
            t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10);
            var paddedMinutes = (minutes < 10) ? '0' + minutes : minutes;
            var seconds = time % 60;
            var paddedSeconds = (seconds < 10) ? '0' + seconds : seconds;
            var defaultFormat = 'mm:ss';

            if (!exp) {
                exp = defaultFormat;
            }

            return exp.replace(/hh/g, (hours) ? hours : '')
                .replace(/HH/g, (paddedHours) ? paddedHours : '')
                .replace(':', (parseInt(paddedHours) || parseInt(hours)) ? ':' : '') // omit the first : if hours === 0 or 00
                .replace(/mm/g, minutes)
                .replace(/MM/g, paddedMinutes)
                .replace(/ss/g, seconds)
                .replace(/SS/g, paddedSeconds);
        };
    });
})(angular);
