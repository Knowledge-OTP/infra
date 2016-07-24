(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'calls-incomming-call': 'components/calls/svg/incomming-call-icon.svg',
                'calls-outcomming-call': 'components/calls/svg/outcomming-call-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
