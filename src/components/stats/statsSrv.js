(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsSrv',
        function (InfraConfigSrv, $q, SubjectEnum, $log, $injector, StorageSrv, CategoryService) {
            'ngInject';

            var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

            var StatsSrv = {};

            var _getCategoryLookup = function () {
                return CategoryService.getCategoryMap().then(function (categoryMap) {
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
                    processedExercises: {}
                };
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(STATS_PATH, defaults);
                });
            }

            function setStats(newStats) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.set(STATS_PATH, newStats);
                });
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

            function _getProcessedExerciseKey(exerciseType, exerciseId) {
                return exerciseType + '_' + exerciseId;
            }

            StatsSrv.getLevelKey = function (level) {
                return 'level' + level + 'Categories';
            };

            StatsSrv.getCategoryKey = function (categoryId) {
                return 'id_' + categoryId;
            };

            StatsSrv.getAncestorIds = function (categoryId) {
                var parentIds = [];
                return _getCategoryLookup().then(function (categoryLookUp) {
                    var categoryIdToAdd = _getParentCategoryId(categoryLookUp, +categoryId);
                    while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                        parentIds.push(categoryIdToAdd);
                        categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                    }
                    return parentIds;
                });
            };

            StatsSrv.getStats = getStats;

            StatsSrv.getLevelStats = function (level) {
                var levelKey = StatsSrv.getLevelKey(level);
                return getStats().then(function (statsData) {
                    return statsData[levelKey];
                });
            };

            StatsSrv.BaseStats = BaseStats;

            StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                return getStats().then(function (stats) {
                    var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                    if (isExerciseRecorded) {
                        return;
                    }

                    var allProm = [];
                    angular.forEach(newStats, function (newStat, processedCategoryId) {
                        var prom = StatsSrv.getAncestorIds(processedCategoryId).then(function (categoriesToUpdate) {
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
                                if (!categoryStats) {
                                    categoryStats = new BaseStats(categoryId);

                                    var parentsIds = categoriesToUpdate.slice(index + 1);
                                    if (parentsIds.length) {
                                        categoryStats.parentsIds = parentsIds;
                                    }

                                    levelStats[categoryKey] = categoryStats;
                                }

                                _baseStatsUpdater(categoryStats, newStat);
                            });
                        });
                        allProm.push(prom);
                    });
                    return $q.all(allProm).then(function () {
                        stats.processedExercises[processedExerciseKey] = true;
                        return setStats(stats);
                    });
                });

            };

            StatsSrv.isExerciseStatsRecorded = function (exerciseType, exerciseId) {
                return StatsSrv.getStats().then(function (stats) {
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return !!stats.processedExercises[processedExerciseKey];
                });
            };

            StatsSrv.getStatsByCategoryId = function (categoryId) {
                var categoryStatsKey = StatsSrv.getCategoryKey(categoryId);
                var categoryStatsParentKey = StatsSrv.getStatsKeyByCategoryId(categoryId);
                return getStats().then(function (stats) {
                    return stats[categoryStatsParentKey][categoryStatsKey];
                });
            };

            return StatsSrv;
        });
})(angular);
