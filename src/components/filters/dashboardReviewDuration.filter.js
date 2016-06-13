(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('dashboardReviewDuration', function($filter){
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
    });
})(angular);
