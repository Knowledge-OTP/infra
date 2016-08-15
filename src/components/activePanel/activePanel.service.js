(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function ($log, $document, $compile, $rootScope) {
            'ngInject';

            var self = this;

            function _init() {
                var body = angular.element(document).find('body');

                var canvasContainerElement = angular.element(
                    '<active-panel></active-panel>'
                );

                self.scope = $rootScope.$new(true);

                body.append(canvasContainerElement);
                $compile(canvasContainerElement)(self.scope);
            }

            _init();
        });
})(angular);
