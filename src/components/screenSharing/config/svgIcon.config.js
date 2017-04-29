(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'screen-sharing-eye': 'components/screenSharing/svg/eye-icon.svg',
                'screen-sharing-close': 'components/screenSharing/svg/close-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
