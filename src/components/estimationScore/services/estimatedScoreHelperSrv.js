(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv', [
        'SubjectEnum', 'InfraConfigSrv',
        function (SubjectEnum, InfraConfigSrv) {
            var EstimatedScoreHelperSrv = this;

            function _getStorageService(){
                return InfraConfigSrv.getStorageService();
            }

            function _getEstimateScorePath(){
                var StorageSrv = _getStorageService();
                return StorageSrv.variables.appUserSpacePath + '/estimatedScore';
            }

            function _SetSubjectInitialVal(obj,initValue){
                var subjectKeys = Object.keys(SubjectEnum);
                for(var i in subjectKeys){
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                var StorageSrv = _getStorageService();
                var ESTIMATE_SCORE_PATH = _getEstimateScorePath();
                if(!EstimatedScoreHelperSrv.getEstimatedScoreData.prom){
                    EstimatedScoreHelperSrv.getEstimatedScoreData.prom = StorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
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

                        for(var prop in defaultValues){
                            var defaultVal = defaultValues[prop];

                            if(angular.isUndefined(estimatedScore[prop])){
                                estimatedScore[prop] = defaultVal ;
                            }

                            if(estimatedScore[prop] !== defaultVal && angular.isObject(defaultValues[prop])){
                                var currVal = estimatedScore[prop];
                                for(var prop1 in defaultVal){
                                    if(angular.isUndefined(currVal[prop1])){
                                        currVal[prop1] = defaultVal[prop1] ;
                                    }
                                }
                            }
                        }

                        return estimatedScore;
                    });
                }
                return EstimatedScoreHelperSrv.getEstimatedScoreData.prom;
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                var StorageSrv = _getStorageService();
                var ESTIMATE_SCORE_PATH = _getEstimateScorePath();
                return StorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
            };
        }
    ]);
})(angular);
