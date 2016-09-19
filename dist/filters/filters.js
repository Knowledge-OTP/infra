(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('capitalize', [
        function () {
            return function (str) {
                if(!angular.isString(str) || !str.length){
                    return '';
                }
                
                return str[0].toUpperCase() + str.substr(1);
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';
    /**
     * @returns Truncated text after the given num and add '...'
     */

    angular.module('znk.infra.filters').filter('ellipsis', function () {
        return function (value, wordwise, max, tail) {
            if (!value) { return ''; }

            max = parseInt(max, 10);
            if (!max) { return value; }
            if (value.length <= max) { return value; }

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace !== -1) {
                    //Also remove . and , so its gives a cleaner result.
                    if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',') {
                        lastspace = lastspace - 1;
                    }
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    });
})(angular);

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
    angular.module('znk.infra.filters').filter('formatDuration', ['$log', function ($log) {
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
    }]);
})(angular);

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
    angular.module('znk.infra.filters').filter('formatTimeDuration', ['$log', function ($log) {
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
    }]);
})(angular);

angular.module('znk.infra.filters').run(['$templateCache', function($templateCache) {

}]);
