(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').service('DueDateSrv', [function () {
        this.isDueDatePass = function (dueDate) {
            const daysInMs = 86400000;

            if (angular.isUndefined(dueDate) || dueDate === null || dueDate === '') {
                dueDate = 0;
            }

            var dateDiff = Math.abs(parseInt((Date.now() - dueDate) / daysInMs, 0));
            var res = {
                dateDiff: dateDiff,
                passDue: (dateDiff > 0)
            };

            return res;
        };
    }
    ]);
})(angular);
