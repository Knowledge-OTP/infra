(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').factory('SessionsStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ENDED', 0, 'ended Session'],
                ['ACTIVE', 1, 'active Session']
            ]);
        }
    );
})(angular);

