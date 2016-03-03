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

                function _getCategoryLookup() {
                    return $injector.invoke(getCategoryLookup);
                }

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
                        totalQuestions = 5;
                        correct = 1;
                        unanswered = 0;
                        wrong = 4;
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

                //function _baseStatsGetter(name) {
                //    return getStats().then(function (dailyPersonalization) {
                //        return dailyPersonalization[name + 'Stats'];
                //    });
                //}
                //
                //function _getCategoryWeakness(category) {
                //    if (!category.totalQuestions) {
                //        return -Infinity;
                //    }
                //    return (category.totalQuestions - category.correct) / (category.totalQuestions);
                //}
                //
                //function _getSpecificCategoryWeakness(specificCategory) {
                //    if (!specificCategory.totalQuestions) {
                //        return -Infinity;
                //    }
                //    return (specificCategory.totalQuestions - specificCategory.correct) / (specificCategory.totalQuestions);
                //}

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

                //function _weakestSpecificCategory(specificCategoriesForGeneralCategory, allSpecificCategory, specificCategoryDataArr, subjectId, generalCategoryId) {
                //    specificCategoriesForGeneralCategory.forEach(function (specificCategoryId) {
                //        var optionalSpecificCategoryData = allSpecificCategory[specificCategoryId];
                //        if (!optionalSpecificCategoryData) {
                //            optionalSpecificCategoryData = new BaseStats(specificCategoryId, subjectId, generalCategoryId);
                //        }
                //        specificCategoryDataArr.push(optionalSpecificCategoryData);
                //    });
                //}
                //
                //function _weakestGeneralCategory(gcForSubject, allGeneralCategory, generalCategoryDataArr, subjectId) {
                //    gcForSubject.forEach(function (generalCategoryId) {
                //        var optionalGeneralCategoryData = allGeneralCategory[generalCategoryId];
                //        if (!optionalGeneralCategoryData) {
                //            optionalGeneralCategoryData = new BaseStats(generalCategoryId, subjectId);
                //        }
                //        generalCategoryDataArr.push(optionalGeneralCategoryData);
                //    });
                //}

                function _getLevelKey(level) {
                    return 'level' + level + 'Categories';
                }

                function _getCategoryKey(categoryId){
                    return 'id_' + categoryId;
                }

                function _getProcessedExerciseKey(exerciseType, exerciseId){
                    return exerciseType + '_' + exerciseId;
                }

                StatsSrv.getStats = getStats;

                StatsSrv.getLevelStats = function(level){
                    var levelKey = _getLevelKey(level);
                    return getStats().then(function(statsData){
                        return statsData[levelKey];
                    });
                };

                StatsSrv.BaseStats = BaseStats;

                StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                    var getCategoryLookupProm = _getCategoryLookup();
                    var getStatsProm = getStats();
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return $q.all([getCategoryLookupProm, getStatsProm]).then(function (res) {
                        var categoryLookUp = res[0];
                        var stats = res[1];

                        var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                        if(isExerciseRecorded){
                            return;
                        }

                        angular.forEach(newStats, function (newStat, categoryId) {
                            var categoriesToUpdate = [];
                            var categoryIdToAdd = +categoryId;
                            while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                                categoriesToUpdate.unshift(categoryIdToAdd);
                                categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                            }

                            categoriesToUpdate.forEach(function (categoryId, index) {
                                var level = index + 1;
                                var levelKey = _getLevelKey(level);
                                var levelStats = stats[levelKey];
                                if (!levelStats) {
                                    levelStats = {};

                                    stats[levelKey] = levelStats;
                                }

                                var categoryKey = _getCategoryKey(categoryId);
                                var categoryStats = levelStats[categoryKey];
                                if(!categoryStats){
                                    categoryStats = new BaseStats(categoryId,true);

                                    var parentsIds = categoriesToUpdate.slice(0,index);
                                    if(parentsIds.length){
                                        parentsIds.reverse();//parent ids order should be from the bottom to the top
                                        categoryStats.parentsIds = parentsIds;
                                    }

                                    levelStats[categoryKey] = categoryStats;
                                }

                                _baseStatsUpdater(categoryStats,newStat);
                            });
                        });
                        stats.processedExercises[processedExerciseKey] = true;
                        return setStats(stats);
                    });

                };

                StatsSrv.isExerciseStatsRecorded = function(exerciseType, exerciseId){
                    return StatsSrv.getStats().then(function(stats){
                        var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                        return !!stats.processedExercises[processedExerciseKey];
                    });
                };
                //StatsSrv.getGeneralCategoryStats = function () {
                //    return _baseStatsGetter('generalCategory');
                //};

                //StatsSrv.getSpecificCategoryStats = function () {
                //    return _baseStatsGetter('specificCategory');
                //};

                //StatsSrv.getWeakestGeneralCategory = function (optionalGeneralCategories) {
                //    return StatsSrv.getGeneralCategoryStats().then(function (allGeneralCategoryStats) {
                //        var optionalGeneralCategoryDataArr = [];
                //        for (var subjectId in optionalGeneralCategories) {
                //            var optionalGeneralCategoriesForSubject = optionalGeneralCategories[subjectId];
                //            _weakestGeneralCategory(optionalGeneralCategoriesForSubject, allGeneralCategoryStats, optionalGeneralCategoryDataArr, subjectId);
                //        }
                //        optionalGeneralCategoryDataArr.sort(function (generalCategory1, generalCategory2) {
                //            return _getCategoryWeakness(generalCategory2) - _getCategoryWeakness(generalCategory1);
                //        });
                //        $log.debug('weakest general categories array', JSON.stringify(optionalGeneralCategoryDataArr));
                //        return optionalGeneralCategoryDataArr[0];
                //    });
                //};

                //StatsSrv.getWeakestSpecificCategory = function (optionalSpecificCategories) {
                //    $log.debug('calculating weakest specific category for exercise type ', JSON.stringify(optionalSpecificCategories));
                //    return StatsSrv.getSpecificCategoryStats().then(function (allSpecificCategoryStats) {
                //        var optionalSpecificCategoryDataArr = [];
                //        for (var subjectId in optionalSpecificCategories) {
                //            var optionalSpecificCategoriesForSubject = optionalSpecificCategories[subjectId];
                //            for (var generalCategoryId in optionalSpecificCategoriesForSubject) {
                //                var optionalSpecificCategoriesForGeneralCategory = optionalSpecificCategoriesForSubject[generalCategoryId];
                //                _weakestSpecificCategory(optionalSpecificCategoriesForGeneralCategory, allSpecificCategoryStats, optionalSpecificCategoryDataArr, subjectId, generalCategoryId);
                //            }
                //        }
                //        optionalSpecificCategoryDataArr.sort(function (specificCategory1, specificCategory2) {
                //            return _getSpecificCategoryWeakness(specificCategory2) - _getSpecificCategoryWeakness(specificCategory1);
                //        });
                //        $log.debug('weakest specific categories array', JSON.stringify(optionalSpecificCategoryDataArr));
                //        return optionalSpecificCategoryDataArr[0];
                //    });
                //};

                StatsSrv.getPerformanceData = function () {
                    return StatsSrv.getStats().then(function (stats) {
                        var subjectsStats = stats.subjectStats;
                        var generalCategoriesStats = stats.generalCategoryStats;

                        var performanceData = {};

                        var generalCategoriesBySubject = {};
                        var generalCategoryStatsKeys = Object.keys(generalCategoriesStats);
                        var weakestGeneralCategoryBySubject = {};
                        generalCategoryStatsKeys.forEach(function (key) {
                            var generalCategoryStats = generalCategoriesStats[key];

                            if (!generalCategoryStats) {
                                $log.error('StatsSrv: getPerformanceData: null general category stat was received for the following key: ', key);
                                return;
                            }

                            if (!generalCategoriesBySubject[generalCategoryStats.subjectId]) {
                                generalCategoriesBySubject[generalCategoryStats.subjectId] = [];
                            }
                            var processedGeneralCategory = {
                                id: generalCategoryStats.id,
                                levelProgress: generalCategoryStats.totalQuestions ? Math.round(generalCategoryStats.correct / generalCategoryStats.totalQuestions * 100) : 0,
                                avgTime: generalCategoryStats.totalTime ? Math.round(generalCategoryStats.totalTime / generalCategoryStats.totalQuestions / 1000) : 0,
                                answeredQuestions: generalCategoryStats.totalQuestions
                            };
                            generalCategoriesBySubject[generalCategoryStats.subjectId].push(processedGeneralCategory);

                            var weakestGeneralCategoryForSubject = weakestGeneralCategoryBySubject[generalCategoryStats.subjectId];
                            if (!weakestGeneralCategoryForSubject || (weakestGeneralCategoryForSubject.successRate > processedGeneralCategory.levelProgress)) {
                                weakestGeneralCategoryBySubject[generalCategoryStats.subjectId] = {
                                    id: processedGeneralCategory.id,
                                    successRate: processedGeneralCategory.levelProgress
                                };
                            }
                        });

                        SubjectEnum.getEnumArr().forEach(function (subject) {
                            var subjectId = subject.enum;

                            var performanceDataForSubject = performanceData[subjectId] = {};

                            performanceDataForSubject.category = generalCategoriesBySubject[subjectId];
                            performanceDataForSubject.weakestCategory = weakestGeneralCategoryBySubject[subjectId];

                            var subjectStats = subjectsStats[subjectId];
                            if (subjectStats) {
                                performanceDataForSubject.overall = {
                                    value: subjectStats.totalQuestions ? Math.round(subjectStats.correct / subjectStats.totalQuestions * 100) : 0,
                                    avgTime: subjectStats.totalTime ? Math.round(subjectStats.totalTime / subjectStats.totalQuestions / 1000) : 0
                                };
                            }

                        });

                        return performanceData;
                    });
                };

                return StatsSrv;
            }
        ];
    });
})(angular);
