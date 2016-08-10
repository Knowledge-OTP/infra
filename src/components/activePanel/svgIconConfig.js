(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'call-mute-icon': 'components/calls/svg/call-mute-icon.svg',
                'share-screen-icon': 'components/activePanel/svg/share-screen-icon.svg',
                'track-teacher-icon': 'components/activePanel/svg/track-teacher-icon.svg',
                'track-student-icon': 'components/activePanel/svg/track-student-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
