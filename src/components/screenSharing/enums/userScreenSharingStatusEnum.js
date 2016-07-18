(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('UserScreenSharingStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['none', 1, 'none'],
                ['VIEWER', 2, 'viewer'],
                ['SHARER', 3, 'sharer']
            ]);
        }
    );
})(angular);

