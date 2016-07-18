(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('UserScreenSharingStateEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['VIEWER', 2, 'viewer'],
                ['SHARER', 3, 'sharer']
            ]);
        }
    );
})(angular);

