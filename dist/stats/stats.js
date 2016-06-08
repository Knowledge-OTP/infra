(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', [
            'znk.infra.enum',
            'znk.infra.znkExercise',
            'znk.infra.utility'
        ])
        .run([
            'StatsEventsHandlerSrv',
            function (StatsEventsHandlerSrv) {
                StatsEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        'exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'UtilitySrv',
        function (exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, UtilitySrv) {
            var StatsEventsHandlerSrv = {};

            StatsEventsHandlerSrv.addNewExerciseResult = function(exerciseType, exercise, results){
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function (isRecorded) {
                    if (isRecorded) {
                        return;
                    }

                    var newStats = {};

                    var questionsMap = UtilitySrv.array.convertToMap(exercise.questions);
                    results.questionResults.forEach(function (result) {
                        var question = questionsMap[result.questionId];
                        var categoryId = question.categoryId;

                        if (isNaN(+categoryId) || categoryId === null) {
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ', question.id, categoryId);
                            return;
                        }

                        if (!newStats[categoryId]) {
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if (angular.isUndefined(result.userAnswer)) {
                            newStat.unanswered++;
                        } else if (result.isAnsweredCorrectly) {
                            newStat.correct++;
                        } else {
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            };

            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsQuerySrv', [
        'StatsSrv', '$q',
        function (StatsSrv, $q) {
            var StatsQuerySrv = {};

            function _getCategoryWeakness(category) {
                if (!category.totalQuestions) {
                    return -Infinity;
                }
                return (category.totalQuestions - category.correct) / (category.totalQuestions);
            }

            function WeaknessAccumulator() {
                var currWeakestCategory = {};

                function _isMostWeakSoFar(categoryWeakness) {
                    return angular.isUndefined(currWeakestCategory.weakness) || currWeakestCategory.weakness < categoryWeakness;
                }

                this.proccessCategory = function (categoryStats) {
                    var categoryWeakness = _getCategoryWeakness(categoryStats);
                    if (_isMostWeakSoFar(categoryWeakness)) {
                        currWeakestCategory.weakness = categoryWeakness;
                        currWeakestCategory.category = categoryStats;
                    }
                };

                this.getWeakestCategory = function () {
                    return currWeakestCategory.category;
                };
            }

            StatsQuerySrv.getWeakestCategoryInLevel = function (level, optionalIds, parentId) {
                function _isOptional(categoryStats) {
                    if (!optionalIds.length && angular.isUndefined(parentId)) {
                        return true;
                    }

                    var id = categoryStats.id;
                    if (optionalIds.length && (optionalIds.indexOf(id) === -1)) {
                        return false;
                    }

                    var parentsIds = categoryStats.parentsIds;
                    if (angular.isDefined(parentId) && parentsIds.indexOf(parentId) === -1) {
                        return false;
                    }

                    return true;
                }

                if (!angular.isArray(optionalIds)) {
                    optionalIds = [];
                }

                return StatsSrv.getLevelStats(level).then(function (levelStats) {
                    var iteratedObjProm = $q.when();
                    var iteratedObj = {};

                    if (optionalIds.length) {
                        var allProm = [];
                        optionalIds.forEach(function (categoryId) {
                            var categoryKey = StatsSrv.getCategoryKey(categoryId);

                            if (levelStats && levelStats[categoryKey]) {
                                iteratedObj[categoryKey] = levelStats[categoryKey];
                            } else {
                                var prom = StatsSrv.getAncestorIds(categoryId).then(function (parentsIds) {
                                    iteratedObj[categoryKey] = new StatsSrv.BaseStats(categoryId, true);
                                    iteratedObj[categoryKey].parentsIds = parentsIds;
                                });
                                allProm.push(prom);
                            }
                        });
                        iteratedObjProm = $q.all(allProm);
                    } else {
                        iteratedObjProm = $q.when();
                        iteratedObj = levelStats;
                    }

                    return iteratedObjProm.then(function () {
                        var weaknessAccumulator = new WeaknessAccumulator();
                        angular.forEach(iteratedObj, function (categoryStats) {
                            if (_isOptional(categoryStats)) {
                                weaknessAccumulator.proccessCategory(categoryStats);
                            }
                        });

                        return weaknessAccumulator.getWeakestCategory();
                    });

                });
            };

            return StatsQuerySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').provider('StatsSrv', function () {
        var getCategoryLookup;
        this.setCategoryLookup = function (_getCategoryLookup) {
            getCategoryLookup = _getCategoryLookup;
        };

        this.$get = [
            'InfraConfigSrv', '$q', 'SubjectEnum', '$log', '$injector',
            function (InfraConfigSrv, $q, SubjectEnum, $log, $injector) {
                if (!getCategoryLookup) {
                    $log.error('StatsSrv: getCategoryLookup was not set !!!!');
                }

                var StorageSrv = InfraConfigSrv.getStorageService();
                var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

                var StatsSrv = {};

                var _getCategoryLookup = function() {
                    return $injector.invoke(getCategoryLookup).then(function(categoryMap){
                        return categoryMap;
                    });
                };

                function BaseStats(id, addInitOffset) {
                    if (angular.isDefined(id)) {
                        this.id = +id;
                    }

                    var totalQuestions;
                    var correct;
                    var unanswered;
                    var wrong;
                    var totalTime;


                    if (addInitOffset) {
                        totalQuestions = 3;
                        correct = 1;
                        unanswered = 0;
                        wrong = 2;
                        totalTime = 0;
                    } else {
                        totalQuestions = 0;
                        correct = 0;
                        unanswered = 0;
                        wrong = 0;
                        totalTime = 0;
                    }

                    this.totalQuestions = totalQuestions;
                    this.correct = correct;
                    this.unanswered = unanswered;
                    this.wrong = wrong;
                    this.totalTime = totalTime;
                }

                function getStats() {
                    var defaults = {
                        processedExercises:{}
                    };
                    return StorageSrv.get(STATS_PATH, defaults);
                }

                function setStats(newStats) {
                    return StorageSrv.set(STATS_PATH, newStats);
                }

                function _baseStatsUpdater(currStat, newStat) {
                    currStat.totalQuestions += newStat.totalQuestions;
                    currStat.correct += newStat.correct;
                    currStat.unanswered += newStat.unanswered;
                    currStat.wrong += newStat.wrong;
                    currStat.totalTime += newStat.totalTime;
                }

                function _getParentCategoryId(lookUp, categoryId) {
                    return lookUp[categoryId] ? lookUp[categoryId].parentId : lookUp[categoryId];
                }

                function _getProcessedExerciseKey(exerciseType, exerciseId){
                    return exerciseType + '_' + exerciseId;
                }

                StatsSrv.getLevelKey = function(level) {
                    return 'level' + level + 'Categories';
                };

                StatsSrv.getCategoryKey = function (categoryId){
                    return 'id_' + categoryId;
                };

                StatsSrv.getAncestorIds = function(categoryId){
                    var parentIds = [];
                    return _getCategoryLookup().then(function(categoryLookUp){
                        var categoryIdToAdd = _getParentCategoryId(categoryLookUp, +categoryId);
                        while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                            parentIds.push(categoryIdToAdd);
                            categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                        }
                        return parentIds;
                    });
                };

                StatsSrv.getStats = getStats;

                StatsSrv.getLevelStats = function(level){
                    var levelKey = StatsSrv.getLevelKey(level);
                    return getStats().then(function(statsData){
                        return statsData[levelKey];
                    });
                };

                StatsSrv.BaseStats = BaseStats;

                StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return getStats().then(function (stats) {
                        var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                        if(isExerciseRecorded){
                            return;
                        }

                        var allProm = [];
                        angular.forEach(newStats, function (newStat, processedCategoryId) {
                            var prom = StatsSrv.getAncestorIds(processedCategoryId).then(function(categoriesToUpdate){
                                categoriesToUpdate.unshift(+processedCategoryId);
                                var deepestLevel = categoriesToUpdate.length;
                                categoriesToUpdate.forEach(function (categoryId, index) {
                                    var level = deepestLevel - index;
                                    var levelKey = StatsSrv.getLevelKey(level);
                                    var levelStats = stats[levelKey];
                                    if (!levelStats) {
                                        levelStats = {};

                                        stats[levelKey] = levelStats;
                                    }

                                    var categoryKey = StatsSrv.getCategoryKey(categoryId);
                                    var categoryStats = levelStats[categoryKey];
                                    if(!categoryStats){
                                        categoryStats = new BaseStats(categoryId);
                                        //need to add init offset only when working on lowest category,
                                        if(level === deepestLevel){
                                            var initStatWithOffset = new BaseStats(null,true);
                                            _baseStatsUpdater(newStat, initStatWithOffset);
                                        }
                                        var parentsIds = categoriesToUpdate.slice(index + 1);
                                        if(parentsIds.length){
                                            categoryStats.parentsIds = parentsIds;
                                        }

                                        levelStats[categoryKey] = categoryStats;
                                    }

                                    _baseStatsUpdater(categoryStats,newStat);
                                });
                            });
                            allProm.push(prom);
                        });
                        return $q.all(allProm).then(function(){
                            stats.processedExercises[processedExerciseKey] = true;
                            return setStats(stats);
                        });
                    });

                };

                StatsSrv.isExerciseStatsRecorded = function(exerciseType, exerciseId){
                    return StatsSrv.getStats().then(function(stats){
                        var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                        return !!stats.processedExercises[processedExerciseKey];
                    });
                };

                return StatsSrv;
            }
        ];
    });
})(angular);

angular.module('znk.infra.stats').run(['$templateCache', function($templateCache) {

}]);
