(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').service('DueDateSrv', [function () {
        this.isDueDatePass = function (dueDate) {
            var daysInMs = 86400000;
            var res = {
                dateDiff: 0,
                passDue: false
            };

            if (angular.isUndefined(dueDate) || dueDate === null || dueDate === '') {
                return res;
            }

            res.dateDiff = Math.abs(parseInt((Date.now() - dueDate) / daysInMs, 0));
            res.passDue = (res.dateDiff > 0);
            return res;
        };
    }
    ]);
})(angular);
