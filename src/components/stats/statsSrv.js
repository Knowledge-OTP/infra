(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').provider('StatsSrv', function(){
        var getCategoryLookup;
        this.setCategoryLookup = function(_getCategoryLookup){
            getCategoryLookup = _getCategoryLookup;
        };

        this.$get = [
            'InfraConfigSrv', '$q', 'SubjectEnum', '$log', '$injector',
            function (InfraConfigSrv, $q, SubjectEnum, $log, $injector) {
                if(!getCategoryLookup){
                    $log.error('StatsSrv: getCategoryLookup was not set !!!!');
                }

                var StorageSrv = InfraConfigSrv.getStorageService();
                var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

                var StatsSrv = {};

                function _getCategoryLookup(){
                    return $injector.invoke(getCategoryLookup);
                }

                function BaseStats(id, subjectId, generalCategoryId) {
                    if (angular.isDefined(id)) {
                        this.id = +id;
                    }

                    if (angular.isDefined(subjectId)) {
                        this.subjectId = +subjectId;
                    }

                    if (angular.isDefined(generalCategoryId)) {
                        this.generalCategoryId = +generalCategoryId;
                    }

                    this.totalQuestions = 0;
                    this.correct = 0;
                    this.unanswered = 0;
                    this.wrong = 0;
                    this.totalTime = 0;
                }


                function getStats() {
                    var defaultValues = {
                        subjectStats: {},
                        generalCategoryStats: {},
                        specificCategoryStats: {}
                    };
                    return StorageSrv.get(STATS_PATH, defaultValues);
                }

                function setStats(newStats) {
                    return StorageSrv.set(STATS_PATH, newStats);
                }

                function _baseStatsGetter(name) {
                    return getStats().then(function (dailyPersonalization) {
                        return dailyPersonalization[name + 'Stats'];
                    });
                }

                function _getCategoryWeakness(category) {
                    if (!category.totalQuestions) {
                        return -Infinity;
                    }
                    return (category.totalQuestions - category.correct) / (category.totalQuestions);
                }

                function _getSpecificCategoryWeakness(specificCategory) {
                    if (!specificCategory.totalQuestions) {
                        return -Infinity;
                    }
                    return (specificCategory.totalQuestions - specificCategory.correct) / (specificCategory.totalQuestions);
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

                StatsSrv.getStats = getStats;

                StatsSrv.BaseStats = BaseStats;

                StatsSrv.getGeneralCategoryStats = function () {
                    return _baseStatsGetter('generalCategory');
                };

                StatsSrv.getSpecificCategoryStats = function () {
                    return _baseStatsGetter('specificCategory');
                };

                function _weakestGeneralCategory(gcForSubject, allGeneralCategory, generalCategoryDataArr, subjectId) {
                    gcForSubject.forEach(function (generalCategoryId) {
                        var optionalGeneralCategoryData = allGeneralCategory[generalCategoryId];
                        if (!optionalGeneralCategoryData) {
                            optionalGeneralCategoryData = new BaseStats(generalCategoryId, subjectId);
                        }
                        generalCategoryDataArr.push(optionalGeneralCategoryData);
                    });
                }

                StatsSrv.getWeakestGeneralCategory = function (optionalGeneralCategories) {
                    return StatsSrv.getGeneralCategoryStats().then(function (allGeneralCategoryStats) {
                        var optionalGeneralCategoryDataArr = [];
                        for (var subjectId in optionalGeneralCategories) {
                            var optionalGeneralCategoriesForSubject = optionalGeneralCategories[subjectId];
                            _weakestGeneralCategory(optionalGeneralCategoriesForSubject, allGeneralCategoryStats, optionalGeneralCategoryDataArr, subjectId);
                        }
                        optionalGeneralCategoryDataArr.sort(function (generalCategory1, generalCategory2) {
                            return _getCategoryWeakness(generalCategory2) - _getCategoryWeakness(generalCategory1);
                        });
                        $log.debug('weakest general categories array', JSON.stringify(optionalGeneralCategoryDataArr));
                        return optionalGeneralCategoryDataArr[0];
                    });
                };

                function _weakestSpecificCategory(specificCategoriesForGeneralCategory, allSpecificCategory, specificCategoryDataArr, subjectId, generalCategoryId) {
                    specificCategoriesForGeneralCategory.forEach(function (specificCategoryId) {
                        var optionalSpecificCategoryData = allSpecificCategory[specificCategoryId];
                        if (!optionalSpecificCategoryData) {
                            optionalSpecificCategoryData = new BaseStats(specificCategoryId, subjectId, generalCategoryId);
                        }
                        specificCategoryDataArr.push(optionalSpecificCategoryData);
                    });
                }

                StatsSrv.getWeakestSpecificCategory = function (optionalSpecificCategories) {
                    $log.debug('calculating weakest specific category for exercise type ', JSON.stringify(optionalSpecificCategories));
                    return StatsSrv.getSpecificCategoryStats().then(function (allSpecificCategoryStats) {
                        var optionalSpecificCategoryDataArr = [];
                        for (var subjectId in optionalSpecificCategories) {
                            var optionalSpecificCategoriesForSubject = optionalSpecificCategories[subjectId];
                            for (var generalCategoryId in optionalSpecificCategoriesForSubject) {
                                var optionalSpecificCategoriesForGeneralCategory = optionalSpecificCategoriesForSubject[generalCategoryId];
                                _weakestSpecificCategory(optionalSpecificCategoriesForGeneralCategory, allSpecificCategoryStats, optionalSpecificCategoryDataArr, subjectId, generalCategoryId);
                            }
                        }
                        optionalSpecificCategoryDataArr.sort(function (specificCategory1, specificCategory2) {
                            return _getSpecificCategoryWeakness(specificCategory2) - _getSpecificCategoryWeakness(specificCategory1);
                        });
                        $log.debug('weakest specific categories array', JSON.stringify(optionalSpecificCategoryDataArr));
                        return optionalSpecificCategoryDataArr[0];
                    });
                };

                StatsSrv.updateStats = function (exerciseType, newStats) {
                    var getCategoryLookupProm = _getCategoryLookup();
                    var getStatsProm = getStats();
                    return $q.all([getCategoryLookupProm, getStatsProm]).then(function (res) {
                        var categoryLookUp = res[0];
                        var stats = res[1];
                        var subjectStats = stats.subjectStats;
                        var generalCategoryStats = stats.generalCategoryStats;
                        var specificCategoryStats = stats.specificCategoryStats;

                        for (var categoryId in newStats) {
                            var newStat = newStats[categoryId];
                            var categoriesToUpdate = [+categoryId];

                            var parentCategoryId = _getParentCategoryId(categoryLookUp, categoryId);
                            if (angular.isDefined(parentCategoryId)) {
                                categoriesToUpdate.unshift(parentCategoryId);
                            }

                            parentCategoryId = _getParentCategoryId(categoryLookUp, parentCategoryId);
                            if (parentCategoryId !== null) {
                                categoriesToUpdate.unshift(parentCategoryId);
                            }

                            var subjectId = categoriesToUpdate[0];
                            var generalCategoryId = categoriesToUpdate[1];
                            var specificCategoryId = categoriesToUpdate[2];


                            if (!subjectStats[subjectId]) {
                                subjectStats[subjectId] = new BaseStats(subjectId);
                                //initial stats set to 4 wrong answer and 1 correct answer
                                subjectStats[subjectId].totalQuestions += 5;
                                subjectStats[subjectId].correct += 1;
                                subjectStats[subjectId].wrong += 4;
                            }
                            _baseStatsUpdater(subjectStats[subjectId], newStat);

                            if (!generalCategoryStats[generalCategoryId]) {
                                generalCategoryStats[generalCategoryId] = new BaseStats(generalCategoryId, subjectId);
                                generalCategoryStats[generalCategoryId].totalQuestions += 5;
                                generalCategoryStats[generalCategoryId].correct += 1;
                                generalCategoryStats[generalCategoryId].wrong += 4;
                            }
                            _baseStatsUpdater(generalCategoryStats[generalCategoryId], newStat);

                            if (specificCategoryId) {
                                if (!specificCategoryStats[specificCategoryId]) {
                                    specificCategoryStats[specificCategoryId] = new BaseStats(specificCategoryId, subjectId, generalCategoryId);
                                    specificCategoryStats[specificCategoryId].totalQuestions += 5;
                                    specificCategoryStats[specificCategoryId].correct += 1;
                                    specificCategoryStats[specificCategoryId].wrong += 4;
                                }
                                _baseStatsUpdater(specificCategoryStats[specificCategoryId], newStat);
                            }
                        }

                        return setStats(stats);
                    });
                };

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
