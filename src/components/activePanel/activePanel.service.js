(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function () {
            'ngInject';

            var self = this;

            var actions = {};

            var STATUSES = {
                ACTIVE: 1,
                NOT_ACTIVE: 2
            };

            this.currentStatus = {
                calls: STATUSES.NOT_ACTIVE,
                screenSharing: STATUSES.NOT_ACTIVE
            };

            this.getActions = function () {
                return actions;
            };

            function _base(name, origin) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    if (origin === 'calls') {
                        switch (name) {
                            case 'showUI' :
                                self.currentStatus.calls = STATUSES.ACTIVE;
                                break;
                            case 'hideUI' :
                                self.currentStatus.calls = STATUSES.NOT_ACTIVE;
                                break;
                        }
                    }
                    fn(origin);
                }
            }

            this.showActivePanelDrv = _base.bind(null, 'showUI');

            this.hideActivePanelDrv = _base.bind(null, 'hideUI');
        });
})(angular);
