(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', [
        function () {
            var ZnkExerciseUtilitySrv = {};

            ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                functionToCopy.forEach(function(fnName){
                    dest[fnName] = src[fnName].bind(src);
                });
            };

            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);
