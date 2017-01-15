(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').service('DueDateSrv', [function () {
        var dayInMs = 86400000;

        this.SEVEN_DAYS_IN_MS = dayInMs*7;

        this.isDueDatePass = function (dueDate) {
            var res = {
                dateDiff: 0,
                passDue: false
            };

            if (angular.isUndefined(dueDate) || dueDate === null || dueDate === '') {
                return res;
            }

            res.dateDiff = Math.abs(parseInt((Date.now() - dueDate) / dayInMs, 0));
            res.passDue =  dueDate - Date.now() < 0;
            return res;
        };
    }
    ]);
})(angular);
