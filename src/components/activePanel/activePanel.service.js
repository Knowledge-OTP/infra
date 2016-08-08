(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function () {
            'ngInject';

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

            function _base(name, arg1) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    fn(arg1);
                }
            }

            this.showActivePanelDrv = _base.bind(null, 'showUI');

            this.hideActivePanelDrv = _base.bind(null, 'hideUI');

            // if (name === 'hideUI') {
            //     angular.forEach(currentStatus, function(value, key) {
            //         // if (value === STATUSES[NOT_ACTIVE]) {
            //         //     runFn = false;
            //         // } else {
            //         //     runFn = true;
            //         // }
            //         console.log(value);
            //     });
            //     debugger;
            // }

        });
})(angular);
