(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSession').factory('SessionBtnStatusEnum',
        function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['START_BTN', 2, 'start btn'],
                ['ENDED_BTN', 3, 'ended btn']
            ]);
        }
    );
})(angular);
