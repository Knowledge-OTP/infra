(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').factory('ActivePanelStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ACTIVE', 1, 'active'],
                ['INACTIVE', 2, 'inactive']
            ]);
        }
    );
})(angular);
