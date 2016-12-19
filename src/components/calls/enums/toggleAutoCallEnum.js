(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('toggleAutoCallEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['DISABLE', 0, 'disable'],
                ['ACTIVATE', 1, 'activate']
            ]);
        }
    );
})(angular);

