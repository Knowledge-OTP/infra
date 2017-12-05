(function (angular) {
    'use strict';
    /**
     * params:
     *  time - in milliseconds
     *  expr -
     *      hh - total hours in duration
     *      mm - total minutes in duration
     *      ss - total seconds in duration
     *      rss - seconds modulo
     */
    angular.module('znk.infra.filters').filter('formatTimeDuration', function ($log) {
        'ngInject';
        return function (time, exp) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }

            time = Math.round(parseInt(time), 10);

            var hours = parseInt(time / 3600000, 10);
            var minutes = parseInt(time / 60000, 10);
            var seconds = parseInt(time / 1000, 10);

            var rss = seconds - (minutes * 60);

            var defaultFormat = 'mm';

            if (!exp) {
                exp = defaultFormat;
            }

            return exp
                .replace(/rss/g, rss)
                .replace(/hh/g, hours)
                .replace(/mm/g, minutes)
                .replace(/ss/g, seconds);
        };
    });
})(angular);
