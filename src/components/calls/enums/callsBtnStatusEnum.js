(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsBtnStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['CALL_BTN', 2, 'call btn'],
                ['CALLED_BTN', 3, 'called btn']
            ]);
        }
    );
})(angular);

