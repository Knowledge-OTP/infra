(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('UserCallStateEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ACTIVE', 1, 'active'],
                ['DONE', 2, 'done']
            ]);
        }
    );
})(angular);

