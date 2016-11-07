(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').factory('SessionsStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['INACTIVE', 0, 'ended Session'],
                ['ACTIVE', 1, 'active Session']
            ]);
        }
    );
})(angular);

