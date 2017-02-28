(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsLevelEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['LEVEL1', 1, 'level1Categories'],
                ['LEVEL2', 2, 'level2Categories'],
                ['LEVEL3', 3, 'level3Categories'],
                ['LEVEL4', 4, 'level4Categories']
            ]);
        }
    ]);
})(angular);
