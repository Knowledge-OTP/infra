(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv',
        function (SubjectEnum, InfraConfigSrv, StorageSrv) {
            'ngInject';

            var EstimatedScoreHelperSrv = this;

            var ESTIMATE_SCORE_PATH = StorageSrv.variables.appUserSpacePath + '/estimatedScore';

            function _SetSubjectInitialVal(obj, initValue) {
                var subjectKeys = Object.keys(SubjectEnum);
                for (var i in subjectKeys) {
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
                        var defaultValues = {
                            estimatedScores: {},
                            sectionsRawScores:{},
                            exercisesRawScores: {},
                            processedExercises: []
                        };

                        _SetSubjectInitialVal(defaultValues.estimatedScores,[]);
                        _SetSubjectInitialVal(defaultValues.sectionsRawScores,[]);
                        var rawScoreInitialObject = {
                            total: 0,
                            earned: 0
                        };
                        _SetSubjectInitialVal(defaultValues.exercisesRawScores,rawScoreInitialObject);

                        angular.forEach(defaultValues, function(defaultVal, defaultValKey){
                            if(angular.isUndefined(estimatedScore[defaultValKey])){
                                estimatedScore[defaultValKey] = defaultVal ;
                            }

                            if(estimatedScore[defaultValKey] !== defaultVal && angular.isObject(defaultVal)){
                                var currVal = estimatedScore[defaultValKey];
                                angular.forEach(defaultVal, function(innerDefaultVal, innerDefaultValueKey){
                                    if(angular.isUndefined(currVal[innerDefaultValueKey])){
                                        currVal[innerDefaultValueKey] = innerDefaultVal;
                                    }
                                });
                            }
                        });

                        return estimatedScore;
                    });
                });
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
                });
            };
        }
    );
})(angular);
