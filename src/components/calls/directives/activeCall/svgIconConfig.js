(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'etutoring-call-mute-icon': 'components/calls/directives/activeCall/svg/etutoring-call-mute-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
