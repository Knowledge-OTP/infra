(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseDataGetters').factory('BaseExerciseGetterSrv',
        function (ContentSrv, $log, $q) {
            'ngInject';

            var BaseExerciseGetterSrvPrototype = {};

            BaseExerciseGetterSrvPrototype.get = function (exerciseId) {
                var contentData = {
                    exerciseId: exerciseId,
                    exerciseType: this.typeName
                };

                return ContentSrv.getContent(contentData).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrvPrototype.getAll = function(){
                var self = this;
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(self.typeName).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({
                            exerciseType: keyValue
                        }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            function BaseExerciseGetterSrv(exerciseTypeName) {
                this.typeName = exerciseTypeName;
            }

            BaseExerciseGetterSrv.getExerciseByNameAndId = function(exerciseId, exerciseTypeName){
                var context = {
                    typeName: exerciseTypeName
                };
                return BaseExerciseGetterSrvPrototype.get.call(context,exerciseId);
            };

            BaseExerciseGetterSrv.prototype = BaseExerciseGetterSrvPrototype;

            return BaseExerciseGetterSrv;
        }
    );
})(angular);
