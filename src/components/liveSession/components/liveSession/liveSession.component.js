(function (angular) {
    'use strict';

    angular.module('znk.infra.liveSession').component('liveSession', {
            templateUrl: 'components/liveSession/components/liveSession/liveSession.template.html',
            bindings: {
                userLiveSessionState: '<',
                onClose: '&'
            },
            controllerAs: 'vm',
            controller: function (UserLiveSessionStateEnum, $log) {
                'ngInject';

                var vm = this;

                this.$onInit = function () {
                    if (vm.userLiveSessionState) {
                        vm.liveSessionCls = 'active-state';
                    } else {
                        $log.error('liveSessionComponent: invalid state was provided');
                    }
                };
            }
        }
    );
})(angular);

