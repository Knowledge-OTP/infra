(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').service('DueDateSrv', [function () {
        var dayInMs = 86400000;
        var WEEK = 7;
        this.SEVEN_DAYS_IN_MS = dayInMs * WEEK;


        this.isDueDatePass = function (dueDate) {
            var res = {
                dateDiff: 0,
                passDue: false
            };

            if (angular.isUndefined(dueDate) || dueDate === null || dueDate === '') {
                return res;
            }

            res.dateDiff = Math.abs(Math.floor((Date.now() - dueDate) / dayInMs));
            res.passDue = dueDate - Date.now() < 0;
            return res;
        };
    }
    ]);
})(angular);
