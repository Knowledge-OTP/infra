(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').factory('activePanelComponentEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['CALLS', 1, 'calls'],
                ['SCREEN_SHARE', 2, 'screenShare']
            ]);
        }
    );
})(angular);
