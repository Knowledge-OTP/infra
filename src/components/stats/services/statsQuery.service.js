(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsQuerySrv',
        function (StatsSrv, $q) {
            'ngInject';
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
        });
})(angular);
