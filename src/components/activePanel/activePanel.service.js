(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function () {
            'ngInject';

            var self = this;

            var actions = {};

            this.getActions = function () {
                return actions;
            };

            function _base(name) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    fn();
                }
            }

            this.showActivePanelDrv = _base.bind(null, 'showUI');

            this.hideActivePanelDrv = _base.bind(null, 'hideUI');

        });
})(angular);
