(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'active-panel-call-mute-icon': 'components/calls/svg/call-mute-icon.svg',
                'active-panel-share-screen-icon': 'components/activePanel/svg/share-screen-icon.svg',
                'active-panel-track-teacher-icon': 'components/activePanel/svg/track-teacher-icon.svg',
                'active-panel-track-student-icon': 'components/activePanel/svg/track-student-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})(angular);
