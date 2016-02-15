(function (angular) {
    'use strict';
    var svgMap = {
        drill: 'components/znkTimeline/svg/icons/timeline-drills-icon.svg' ,
        game: 'components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg' ,
        tutorial: 'components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg' ,
        section: 'components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg',
        practice: 'components/znkTimeline/svg/icons/timeline-test-icon.svg'
    };
    angular.module('znk.infra.znkTimeline', ['znk.infra.svgIcon', 'znk.infra.enum'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }])
        .constant('timelineImages', svgMap);

})(angular);
