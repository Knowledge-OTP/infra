(function (angular) {
    'use strict';

    angular.module('znk.infra.user').factory('AccountStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ACTIVE', 1, 'active'],
                ['INACTIVE', 2, 'inactive'],
                ['NON_ZOE', 3, 'nonZoe']
            ]);
        }
    );
})(angular);
