(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('PlatformEnum',
        function (EnumSrv) {
            'ngInject';
            return new EnumSrv.BaseEnum([
                ['MOBILE', 1, 'mobile'],
                ['DESKTOP', 2, 'desktop']
            ]);
        });
})(angular);

