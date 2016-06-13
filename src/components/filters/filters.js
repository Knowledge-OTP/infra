(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';
    /**
     * @param time (in seconds)
     * @param exp (expression to display time)
     * @returns formatted time string
     */
    function formatDuration() {
        return function(time, exp) {
            var t = parseInt(time, 10);
            var hours = parseInt(t / 3600, 10);
            t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10);
            t = t - (minutes * 60);
            var seconds = time % 60;
            var defaultFormat = 'mm:ss';

            if (!exp) {
                exp = defaultFormat;
            }
            return exp.replace(/hh/g,hours).replace(/mm/g,minutes).replace(/ss/g,seconds);
        };
    }

    function dashboardReviewDuration($filter) {
        return function(time) {
            var t = parseInt(time, 10);
            var hours = parseInt(t / 3600, 10);
            var minutes = parseInt(t / 60, 10);

            var exp = '';
            if (hours) {
                exp += 'hhh';
            }
            if (minutes) {
                if (exp) {
                    exp += ' ,mmm';
                } else {
                    exp += 'mmm';
                }
            }
            if (time < 60) {
                exp = 'ss sec';
            }
            return $filter('formatDuration')(time, exp);
        };
    }

    angular.module('znk.infra.filters')
        .filter('formatDuration', formatDuration)
        .filter('dashboardReviewDuration', dashboardReviewDuration);
})(angular);
