(function (angular) {
    'use strict';

    angular.module('znk.infra.calls', [
        'znk.infra.webcall',
        'znk.infra.config',
        'znk.infra.user',
        'znk.infra.enum',
        'ngMaterial',
        'znk.infra.callsModals'
    ]);
})(angular);
