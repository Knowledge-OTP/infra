(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('ScreenSharingStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_VIEWER', 1, 'pending viewer'],
                ['PENDING_SHARER', 2, 'pending sharer'],
                ['CONFIRMED', 3, 'confirmed'],
                ['ENDED', 4, 'ended']
            ]);
        }
    );
})(angular);

