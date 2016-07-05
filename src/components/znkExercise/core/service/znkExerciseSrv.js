(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseSrv', [
        /*'ZnkModalSrv',*/
        function (/*ZnkModalSrv,*/) {
            var allowedTimeForQuestionByExercise = {};

            this.setAllowedTimeForQuestionByExercise = function (allowedTime) {
                allowedTimeForQuestionByExercise = allowedTime;
            };


            this.$get = ['EnumSrv', '$window', 'PlatformEnum',
                function (EnumSrv, $window, PlatformEnum) {

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


                    // return ZnkExerciseSrv;
                    return {
                        getPlatform: function () {
                            return platform;
                        },
                        getAllowedTimeForQuestionByExercise: function () {
                            return allowedTimeForQuestionByExercise;
                        },
                        openExerciseToolBoxModal: openExerciseToolBoxModal
                    };


                }];
        }
    ]);
})(angular);
