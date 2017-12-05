(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseSrv', function () {
            'ngInject';

            var exerciseTypeToAllowedQuestionTimeMap;
            this.setAllowedTimeForQuestionMap = function (_exerciseTypeToAllowedQuestionTimeMap) {
                exerciseTypeToAllowedQuestionTimeMap = _exerciseTypeToAllowedQuestionTimeMap;
            };

            var defaultBindExerciseKeys = [
                {
                    getterName: 'currSlideIndex',
                    setterName: 'setCurrentIndex'
                },
                {
                    getterName: 'answerExplanation'
                }
            ];

            var addBindExerciseKeys;

            var bindExerciseKeys;

            this.addBindExerciseKeys = function(_addBindExerciseKeys) {
                addBindExerciseKeys = _addBindExerciseKeys;
            };

            this.$get = function (EnumSrv, $window, PlatformEnum, $log) {
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
                        $log.error('ZnkExerciseSrv: the following exercise type:' + exerciseType +' has no question allowed time');
                    }
                    return exerciseTypeToAllowedQuestionTimeMap[exerciseType];
                };

                ZnkExerciseSrv.getBindExerciseKeys = function() {
                    if (!bindExerciseKeys) {
                        bindExerciseKeys = (angular.isArray(addBindExerciseKeys)) ?
                            defaultBindExerciseKeys.concat(addBindExerciseKeys) : defaultBindExerciseKeys;
                    }
                    return bindExerciseKeys;
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
        });
})(angular);
