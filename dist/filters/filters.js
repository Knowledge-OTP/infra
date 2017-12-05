(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('capitalize', function () {
        'ngInject';
            return function (str) {
                if(!angular.isString(str) || !str.length){
                    return '';
                }

                return str[0].toUpperCase() + str.substr(1);
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
    angular.module('znk.infra.filters').filter('formatDuration', ["$log", function ($log) {
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
    angular.module('znk.infra.filters').filter('formatTimeDuration', ["$log", function ($log) {
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
    }]);
})(angular);

(function() {
    'use strict';
    /*
    @param time (in milliseconds)
    */
    angular
        .module('znk.infra.filters').filter('roundDuration', function() {
            return function FilterFilter(time) {
                var ONE_MIN_IN_MILLISECONDS = 60000;
                var ONE_HOUR_IN_MILLISECONDS = 3600000;
                var remainedSec;
                var remainedMin;
                var numOfSec;
                var numOfMin;
                var numOfHours;
                var filteredTime;
                if (time <= ONE_MIN_IN_MILLISECONDS) {
                    filteredTime = Math.round(time / 1000) + ' sec';
                } else if (time % ONE_MIN_IN_MILLISECONDS < time && time > 0 && time < 3600000) {
                    remainedSec = time % ONE_MIN_IN_MILLISECONDS;
                    numOfMin = Math.round(time / ONE_MIN_IN_MILLISECONDS) + ' min ';
                    numOfSec = remainedSec ? Math.round(remainedSec / 1000) + ' sec' : '';
                    filteredTime = numOfMin + numOfSec;
                } else {
                    remainedMin = time % ONE_HOUR_IN_MILLISECONDS;
                    remainedSec = remainedMin % ONE_MIN_IN_MILLISECONDS;
                    numOfHours = Math.floor(time / ONE_HOUR_IN_MILLISECONDS) + 'h ';
                    numOfMin = remainedMin && remainedMin > ONE_MIN_IN_MILLISECONDS ? Math.floor(remainedMin / ONE_MIN_IN_MILLISECONDS) + ' min ' : '';
                    numOfSec = remainedSec ? Math.round(remainedSec / 1000) + ' sec' : '';
                    filteredTime = numOfHours + numOfMin + numOfSec;
                }
                return filteredTime;

            };
        }
        );
})();
angular.module('znk.infra.filters').run(['$templateCache', function ($templateCache) {

}]);
