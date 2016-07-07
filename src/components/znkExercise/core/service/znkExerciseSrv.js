(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseSrv',
        function () {
            'ngInject';

            var exerciseTypeToAllowedQuestionTimeMap;
            this.setAllowedTimeForQuestionMap = function (_exerciseTypeToAllowedQuestionTimeMap) {
                exerciseTypeToAllowedQuestionTimeMap = _exerciseTypeToAllowedQuestionTimeMap;
            };

            this.$get = function (EnumSrv, $window, PlatformEnum, $log) {
                'ngInject';//jshint ignore:line

                var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
                var ZnkExerciseSrv = {};

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
                    //var modalOptions = {
                    //    templateUrl: 'scripts/exercise/templates/znkExerciseToolBoxModal.html',
                    //    hideBackdrop: true,
                    //    ctrl: 'ZnkExerciseToolBoxModalCtrl',
                    //    ctrlAs: 'toolBoxCtrl',
                    //    dontCentralize: true,
                    //    wrapperClass: 'znk-exercise-toolbox ' + toolBoxModalSettings.wrapperCls,
                    //    resolve: {
                    //        Settings: toolBoxModalSettings
                    //    }
                    //};
                    //return ZnkModalSrv.modal(modalOptions);
                }

                ZnkExerciseSrv.openExerciseToolBoxModal = openExerciseToolBoxModal;

                ZnkExerciseSrv.getPlatform = function () {
                    return platform;
                };

                ZnkExerciseSrv.getAllowedTimeForQuestion = function (exerciseType) {
                    if(!exerciseTypeToAllowedQuestionTimeMap || !exerciseTypeToAllowedQuestionTimeMap[exerciseType]){
                        $log.error('ZnkExerciseSrv: the following exercise type has no question allowed time');
                    }
                    return exerciseTypeToAllowedQuestionTimeMap[exerciseType];
                };

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                return ZnkExerciseSrv;
            };
        }
    );
})(angular);
