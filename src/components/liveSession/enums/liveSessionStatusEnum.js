(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').factory('LiveSessionStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_STUDENT', 1, 'pending student'],
                ['PENDING_EDUCATOR', 2, 'pending educator'],
                ['CONFIRMED', 3, 'confirmed'],
                ['ENDED', 4, 'ended']
            ]);
        }
    );
})(angular);

