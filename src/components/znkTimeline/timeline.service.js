(function (angular) {
    'use strict';

    var svgMap = {
        drill: 'components/znkTimeline/svg/icons/timeline-drills-icon.svg',
        game: 'components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg',
        tutorial: 'components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg',
        section: 'components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg',
        practice: 'components/znkTimeline/svg/icons/timeline-test-icon.svg'
    };

    angular.module('znk.infra.znkTimeline').service('TimelineSrv', ['ExerciseTypeEnum', function (ExerciseTypeEnum) {

        this.getImages = function () {
            var imgObj = {};

            if (ExerciseTypeEnum.TUTORIAL) {
                imgObj[ExerciseTypeEnum.TUTORIAL.enum] = {icon: svgMap.tutorial};
            }
            if (ExerciseTypeEnum.PRACTICE) {
                imgObj[ExerciseTypeEnum.PRACTICE.enum] = {icon: svgMap.practice};
            }
            if (ExerciseTypeEnum.GAME) {
                imgObj[ExerciseTypeEnum.GAME.enum] = {icon: svgMap.game};
            }
            if (ExerciseTypeEnum.SECTION) {
                imgObj[ExerciseTypeEnum.SECTION.enum] = {icon: svgMap.section};
            }
            if (ExerciseTypeEnum.DRILL) {
                imgObj[ExerciseTypeEnum.DRILL.enum] = {icon: svgMap.drill};
            }

            return imgObj;
        };

    }]).config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

