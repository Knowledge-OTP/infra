(function (angular) {
    'use strict';
    angular.module('znk.infra.znkTimeline').service('TimelineSrv',['ExerciseTypeEnum', 'timelineImages', function(ExerciseTypeEnum, timelineImages) {

        this.getImages = function() {
            var imgObj = {};

            imgObj[ExerciseTypeEnum.TUTORIAL.enum] = {icon: timelineImages.tutorial};
            imgObj[ExerciseTypeEnum.PRACTICE.enum] = {icon: timelineImages.practice};
            imgObj[ExerciseTypeEnum.GAME.enum] = {icon: timelineImages.game};
            imgObj[ExerciseTypeEnum.SECTION.enum] = {icon: timelineImages.section};
            imgObj[ExerciseTypeEnum.DRILL.enum] = {icon: timelineImages.drill};

            return imgObj;
        };

    }]);
})(angular);

