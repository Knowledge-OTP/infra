(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsActionStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['DISCONNECT_ACTION', 1, 'disconnect'],
                ['CONNECT_ACTION', 2, 'connect'],
                ['DISCONNECT_AND_CONNECT_ACTION', 3, 'disconnect and connect']
            ]);
        }
    );
})(angular);

