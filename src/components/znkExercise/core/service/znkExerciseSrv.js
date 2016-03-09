(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSrv', [
        /*'ZnkModalSrv',*/ 'EnumSrv', '$window', 'PlatformEnum',
        function (/*ZnkModalSrv, */EnumSrv, $window, PlatformEnum) {
            var ZnkExerciseSrv = {};

            var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
            ZnkExerciseSrv.getPlatform = function(){
                return platform;
            };

            ZnkExerciseSrv.openExerciseToolBoxModal = function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
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
            };

            //ZnkExerciseSrv.viewModeEnum = new EnumSrv.BaseEnum([
            //    ['answerWithResult', 1, 'Answer With Result'],
            //    ['answerOnly', 2, 'Answer Only'],
            //    ['review', 3, 'Review'],
            //    ['mustAnswer', 4, 'Must Answer']
            //]);

            ZnkExerciseSrv.toolBoxTools = {
                BLACKBOARD: 'blackboard',
                MARKER: 'mar',
                CALCULATOR: 'cal',
                BOOKMARK: 'bookmark',
                SHOW_PAGER: 'show pager'
            };

            //ZnkExerciseSrv.slideDirections = {
            //    NONE: 'none',
            //    ALL: 'all',
            //    RIGHT: 'right',
            //    LEFT: 'left'
            //};

            return ZnkExerciseSrv;
        }
    ]);
})(angular);
