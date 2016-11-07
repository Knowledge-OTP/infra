(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function ($document, $compile, $rootScope, $log) {
            'ngInject';

            var self = this;

            var activePanelCb;

            this.loadActivePanel = function () {
                var body = angular.element($document).find('body');

                var canvasContainerElement = angular.element(
                    '<active-panel></active-panel>'
                );

                if (!angular.element(body[0].querySelector('active-panel')).length) {
                    self.scope = $rootScope.$new(true);
                    body.append(canvasContainerElement);
                    $compile(canvasContainerElement)(self.scope);
                }
            };

            this.registerActivePanelCb = function(_cb) {
                activePanelCb = _cb;
            };

            this.showActivePanel = function () {
                if (angular.isUndefined(activePanelCb)){
                    $log.error('activePanelCb is undefined');
                    return;
                }
                activePanelCb();
            };

        });
})(angular);
