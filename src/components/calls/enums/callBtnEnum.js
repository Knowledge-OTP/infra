(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallBtnEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE', 1, 'offline'],
                ['CALL', 2, 'call'],
                ['CALLED', 3, 'called']
            ]);
        }
    );
})(angular);

