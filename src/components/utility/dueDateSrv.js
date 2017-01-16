(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').service('DueDateSrv', [function () {
        var dayInMs = 86400000;
        var WEEK = 7;
        this.SEVEN_DAYS_IN_MS = dayInMs * WEEK;

        this.isDueDatePass = function (startDate) {
            var res = {
                dateDiff: 0,
                passDue: false
            };

            if (angular.isUndefined(startDate) || startDate === null || startDate === '') {
                return res;
            }

            res.dateDiff = Math.abs(parseInt((Date.now() - startDate) / dayInMs, 0));
            res.passDue =  res.dateDiff > WEEK;
            return res;
        };
    }
    ]);
})(angular);
