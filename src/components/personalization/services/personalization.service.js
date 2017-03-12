(function (angular) {
    'use strict';

    angular.module('znk.infra.personalization')
        .service('PersonalizationSrv',
            function (StorageRevSrv, $log, $q, WorkoutPersonalizationServiceUtil, StatsQuerySrv, ExerciseStatusEnum, StatsSrv, ExerciseTypeEnum, WorkoutsSrv, CategoryService, ExerciseResultSrv) {
                'ngInject';

                var self = this;

                this.getPersonalizationData = function () {
                    return _getPersonalizationData();
                };

                this.getExamOrder = function () {
                    return self.getPersonalizationData().then(function (personalizationData) {
                        var errorMsg = 'PersonalizationSrv getExamOrder: personalization.examOrder is not array or empty!';
                        if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                            $log.error(errorMsg);
                            return $q.reject(errorMsg);
                        }
                        return personalizationData.examOrder;
                    });
                };

                // For WorkoutPersonalization.Service.js, replace the following function:
                this.getPersonalizedExercise = function (subjectsToIgnore, workoutOrder, exerciseTypesToIgnore) {
                    if (angular.isUndefined(subjectsToIgnore) && !angular.isNumber(subjectsToIgnore)) {
                        subjectsToIgnore = [];
                    }
                    if (angular.isUndefined(exerciseTypesToIgnore) && !angular.isNumber(exerciseTypesToIgnore)) {
                        exerciseTypesToIgnore = [];
                    }
                    if (angular.isNumber(subjectsToIgnore)) {
                        subjectsToIgnore = [subjectsToIgnore];
                    }

                    return $q.all([
                        _getAvailableExercises(),
                        _getStatsNewStructure()
                    ]).then(function (res) {
                        var availableExercises = res[0];
                        var stats = res[1];
                        var availableStats = _filterStatsByAvailableCategories(stats, availableExercises.availableCategories);
                        return _generateExercisesForAllTimes(availableExercises, availableStats, subjectsToIgnore, exerciseTypesToIgnore);
                    });
                };
                this.getAvailableExercises = function (includeInProgress) {
                    return _getAvailableExercises(includeInProgress);
                };
                /* _generateExercisesForAllTimes
                 * Returns an exercise for each of the time bundles (if available)
                 * Starts by searching for the weakest subject in the "availableStats" that is not in the "subjectsToIgnore" list
                 * If not found, look for a subject in the "availableExercises" that is not in the "subjectsToIgnore" list
                 * If found in the "availableExercises" but not in the "availableStats", it means the found subject doesn't have stats for the user
                 * If we couldn't find an available subject in the "availableExercises" as well, then we try again (recursively) with no "subjectsToIgnore" */
                function _generateExercisesForAllTimes(availableExercises, availableStats, subjectsToIgnore, exerciseTypesToIgnore) {
                    // If we have no available content - return
                    if (!availableExercises || !availableExercises.availableCategories) {
                        return null;
                    }

                    var currSubject;
                    var foundStats = false;

                    // Search for the weakest available subject that is not in the ignore list
                    var orderedStatsList = availableStats.orderedStats;

                    for (var index = 0; index < orderedStatsList.length; index++) {
                        if (!subjectsToIgnore || (subjectsToIgnore && subjectsToIgnore.indexOf(orderedStatsList[index].categoryId) === -1)) {
                            currSubject = orderedStatsList[index].categoryId;
                            foundStats = true;
                            break;
                        }
                    }
                    var timeBundles = Object.keys(availableExercises).filter(function (num) {
                        return !isNaN(num); // check if key is number
                    });

                    // If we couldn't find an available subject in the stats, look for an available subject in the availableExercises
                    if (!currSubject) {
                        // Run through availableExercises.timeBundles
                        for (var i = 0; i < timeBundles.length; i++) {
                            // Run through the availableExercises[timeBundle].availableSubjects
                            var availableSubjects = Object.keys(availableExercises[timeBundles[i]]);
                            for (var j = 0; j < availableSubjects.length; j++) {
                                if (!subjectsToIgnore || (subjectsToIgnore && subjectsToIgnore.indexOf(availableSubjects[j]) === -1)) {
                                    currSubject = availableSubjects[j];
                                    break;
                                }
                            }// END availableSubjects.forEach
                            // If we found an availableSubject, break the loop through the availableExercises.timeBundles
                            if (currSubject) {
                                break;
                            }
                        }// END timeBundles.forEach
                    }

                    // If we couldn't find an available subject in the availableExercises as well (as in the availableStats)
                    if (!currSubject) {
                        // If we have no "subjectsToIgnore" then it means we have no more exercises
                        if (!subjectsToIgnore || subjectsToIgnore.length === 0) {
                            return null;
                        }
                        // Otherwise, try again with "subjectsToIgnore" = empty
                        return _generateExercisesForAllTimes(availableExercises, availableStats, null, exerciseTypesToIgnore);
                    }

                    // If we got here, we must have found an available subject (either in the availableStats list or in the availableExercises list)
                    var foundExercises = {
                        // Indicate in the result obj (foundExercises) which subjectId we used
                        subjectId: currSubject
                    };
                    var atLeastOneExerciseFound = false;
                    // Go through each timeBundle and look for an exercise for it
                    angular.forEach(timeBundles, function (timeBundle) {
                        if (availableExercises[timeBundle] && availableExercises[timeBundle][currSubject]) {
                            if (foundStats) {
                                // Look for an exercise for "timeBundle" and "currSubject" by weakest cat (sending only the relevant "availableExercises" and "availableStats" for these time and subject)
                                foundExercises[timeBundle] = _getExerciseForTimeAndSubjectByWeakestCat(availableExercises[timeBundle][currSubject], availableStats.subCategories[currSubject], exerciseTypesToIgnore, []);
                                // If we couldn't find an exercise for this time bundle, try again with no "exerciseTypeToIgnore" constraint
                                if (!foundExercises[timeBundle]) {
                                    foundExercises[timeBundle] = _getExerciseForTimeAndSubjectByWeakestCat(availableExercises[timeBundle][currSubject], availableStats.subCategories[currSubject], [], []);
                                }
                            } else {
                                // Look for an exercise for "timeBundle" and "currSubject" ignoring weakest cat (sending only the relevant "availableExercises" and "availableStats" for these time and subject)
                                foundExercises[timeBundle] = _getExerciseForTimeAndSubjectNoWeakestCat(availableExercises[timeBundle][currSubject], null, exerciseTypesToIgnore, []);
                                // If we couldn't find an exercise for this time bundle, try again with no "exerciseTypeToIgnore" constraint
                                if (!foundExercises[timeBundle]) {
                                    foundExercises[timeBundle] = _getExerciseForTimeAndSubjectNoWeakestCat(availableExercises[timeBundle][currSubject], availableStats.subCategories[currSubject], [], []);
                                }
                            }
                            // If we found an exercises, set the indication that we did and add it's exerciseType to the "exerciseTypesToIgnore" list for the following exercises (for the other timeBundles, to get varaity)
                            if (foundExercises[timeBundle]) {
                                atLeastOneExerciseFound = true;
                                exerciseTypesToIgnore.push(foundExercises[timeBundle].exerciseTypeId);
                            }
                            if ((!isNaN(foundExercises.subjectId)) && (foundExercises[timeBundle])) {
                                foundExercises[timeBundle].subjectId = foundExercises.subjectId;
                            }
                        }
                    }); // exerciseTimeArr.forEach
                    if (atLeastOneExerciseFound) {
                        return foundExercises;
                    }
                    return null;
                }

                /* _getExerciseForTimeAndSubjectByWeakestCat
                 * Searches for the exercise of the weakest lowest (level) category and returns it as long as it is not one of the "exerciseTypesToIgnore" */
                function _getExerciseForTimeAndSubjectByWeakestCat(availableExercises, availableStats, exerciseTypesToIgnore, currCategoryHierarchy) {
                    var orderedStatsList = availableStats.orderedStats;
                    for (var i = 0; i < orderedStatsList.length; i++) {
                        var subCategory = orderedStatsList[i].categoryId;
                        if (availableStats.subCategories && availableStats.subCategories[subCategory]) {
                            // Run recursively for the "subCategory"
                            currCategoryHierarchy.push(subCategory);
                            var foundExercise = _getExerciseForTimeAndSubjectByWeakestCat(availableExercises, availableStats.subCategories[subCategory], exerciseTypesToIgnore, currCategoryHierarchy);
                            // If we found an exercise, return it, otherwise continue to another iteration (the next subCategory) or check the current one (if we exhausted the subCategories)
                            if (foundExercise) {
                                return foundExercise;
                            }
                            // If we got here, it means we didn't find an exercise for "subCategory", so pop out "subCategory" from "currCategoryHierarchy" and continue with the loop to the next "subCategory"
                            currCategoryHierarchy.pop();
                        }
                    }
                    // If we got here, it means we do not have any subCategories OR we exhausted all of our subCategories.  So create a new availableExercises obj that will hold the reference to the exercise category we're looking for
                    var availableExercisesDeep = availableExercises;
                    // Look for an exercise for the "availableStats.id" in "availableExercises" using the "currCategoryHierarchy" category path
                    for (var j = 0; j < currCategoryHierarchy.length; j++) {
                        var currCatId = currCategoryHierarchy[j];
                        if (availableExercisesDeep.subCategories && availableExercisesDeep.subCategories[currCatId]) {
                            availableExercisesDeep = availableExercisesDeep.subCategories[currCatId];
                        } else {
                            // This means we couldn't find the equivalent of "currCategoryHierarchy" in "availableExercises", so we'll try to get an exercise from the current level we got to in the "availableExercises" obj
                            break;
                        }
                    }
                    return _getAvailableExercise(availableExercisesDeep, exerciseTypesToIgnore);
                }

                /* _getExerciseForTimeAndSubjectNoWeakestCat
                 * Searches for any exercise from the bottom most (category) level and returns it (the first it will encounter)
                 *  as long as it is not one of the "exerciseTypesToIgnore" */
                function _getExerciseForTimeAndSubjectNoWeakestCat(availableExercises, exerciseTypesToIgnore) {
                    // Get the current level's categories
                    var categoryIds = Object.keys(availableExercises.subCategories);
                    angular.forEach(categoryIds, function (categoryId) {
                        return _getExerciseForTimeAndSubjectNoWeakestCat(availableExercises.subCategories[categoryId], exerciseTypesToIgnore);
                    });
                    // Try to get one of the exercises from the current(category) level
                    return _getAvailableExercise(availableExercises, exerciseTypesToIgnore);
                }

                /* _getAvailableExercise
                 * Returns an exercise with the "availableStats.id" category from "availableExercises"
                 * exerciseTypesToIgnore - tries to get an exercise for a type not in "exerciseTypesToIgnore", if not found then get any exercise type */
                function _getAvailableExercise(availableExercises, exerciseTypesToIgnore) {
                    if (availableExercises.exercises) {
                        // If we got exercises (found the ones for the requested category), look for a one to return
                        var availableExerciseTypes = Object.keys(availableExercises.exercises).filter(function (item) {
                            return angular.isDefined(item);
                        });
                        for (var i = 0; i < availableExerciseTypes.length; i++) {
                            var exerciseTypeId = parseInt(availableExerciseTypes[i], 10);
                            // Go through the types of available exercises and get one that is not in the "exerciseTypesToIgnore" list
                            if (!exerciseTypesToIgnore || (exerciseTypesToIgnore && exerciseTypesToIgnore.indexOf(exerciseTypeId) === -1)) {
                                // TODO: We found in debug that sometimes "availableExercises.exercises[exerciseTypeId]" is key=value and sometimes the keys are a sequence...
                                var exerciseIds = availableExercises.exercises[exerciseTypeId];
                                var exerciseIdKeys = Object.keys(exerciseIds);
                                if (exerciseIds && exerciseIdKeys.length > 0) {
                                    var foundExercise = {
                                        exerciseTypeId: exerciseTypeId,
                                        exerciseId: exerciseIds[exerciseIdKeys[0]]
                                    };
                                    return foundExercise;
                                }
                            }
                        }
                    }
                    return null;
                }

                function _filterStatsByAvailableCategories(stats, availableCategories) {
                    var hasAvailableSubCategories = false;
                    var filteredStats = {
                        subCategories: {},
                        orderedStats: [],
                        id: stats.id
                    };
                    if (stats.subCategories) {
                        var subCategoryIds = Object.keys(stats.subCategories);
                        angular.forEach(subCategoryIds, function (subCategoryId) {
                            subCategoryId = parseInt(subCategoryId, 10);
                            filteredStats.subCategories[subCategoryId] = _filterStatsByAvailableCategories(stats.subCategories[subCategoryId], availableCategories);
                            // Check if we got a sub category (not null / undefined)
                            hasAvailableSubCategories = filteredStats.subCategories[subCategoryId] ? true : hasAvailableSubCategories;

                            var statsSubCategory = stats.subCategories[subCategoryId];
                            var orderedStat = {
                                categoryId: subCategoryId,
                                statAccuracy: ((1 / statsSubCategory.totalQuestions) + (statsSubCategory.correct / statsSubCategory.totalQuestions))
                            };
                            filteredStats.orderedStats.push(orderedStat);
                        });
                        filteredStats.orderedStats.sort(function (stat1, stat2) {
                            return stat2.statAccuracy - stat1.statAccuracy; // TODO: verify desc
                        });
                    }
                    // If the current category isn't in the "availableCategories" and it has no subCategories,
                    //  then don't return it ---> removing it from the available stats tree
                    if (angular.isDefined(stats.id) && availableCategories.indexOf(stats.id) === -1 && !hasAvailableSubCategories) {
                        return null;
                    }
                    return filteredStats;
                }

                function _getStatsNewStructure() {
                    return StatsSrv.getStats().then(function (stats) {
                        var newStats = {};
                        var categoryIdsText;

                        if (stats.level1Categories) {
                            categoryIdsText = Object.keys(stats.level1Categories);
                            angular.forEach(categoryIdsText, function (categoryIdText) {
                                var categoryId = categoryIdText.split('_').pop();
                                if (!isNaN(categoryId)) {
                                    if (!newStats.subCategories) {
                                        newStats.subCategories = {};
                                    }
                                    newStats.subCategories[categoryId] = stats.level1Categories[categoryIdText];
                                }
                            });  // categoryIdsText.forEach => level1Categories
                        }
                        if (stats.level2Categories) {
                            categoryIdsText = Object.keys(stats.level2Categories);
                            angular.forEach(categoryIdsText, function (categoryIdText) {
                                if (stats.level2Categories[categoryIdText].parentsIds) {
                                    var parentId1 = stats.level2Categories[categoryIdText].parentsIds[0];
                                    var categoryId = categoryIdText.split('_').pop();
                                    if (!isNaN(categoryId)) {
                                        var newStatsSubCategories1 = newStats.subCategories[parentId1];
                                        if (!newStatsSubCategories1.subCategories) {
                                            newStatsSubCategories1.subCategories = {};
                                        }
                                        newStatsSubCategories1.subCategories[categoryId] = stats.level2Categories[categoryIdText];
                                    }
                                } else {
                                    $log.error('stats - missing category parent ids for: ' + categoryIdText);
                                }
                            });  // categoryIdsText.forEach => level2Categories
                        }


                        if (stats.level3Categories) {
                            categoryIdsText = Object.keys(stats.level3Categories);
                            angular.forEach(categoryIdsText, function (categoryIdText) {
                                if (stats.level3Categories[categoryIdText].parentsIds) {
                                    var parentId1 = stats.level3Categories[categoryIdText].parentsIds[0];
                                    var parentId2 = stats.level3Categories[categoryIdText].parentsIds[1];
                                    var categoryId = categoryIdText.split('_').pop();
                                    if (!isNaN(categoryId)) {
                                        var newStatsSubCategories2 = newStats.subCategories[parentId2].subCategories[parentId1];
                                        if (!newStatsSubCategories2.subCategories) {
                                            newStatsSubCategories2.subCategories = {};
                                        }
                                        newStatsSubCategories2.subCategories[categoryId] = stats.level3Categories[categoryIdText];
                                    }
                                } else {
                                    $log.error('stats - missing category parent ids for: ' + categoryIdText);
                                }
                            });  // categoryIdsText.forEach => level3Categories
                        }
                        if (stats.level4Categories) {
                            categoryIdsText = Object.keys(stats.level4Categories);
                            angular.forEach(categoryIdsText, function (categoryIdText) {
                                if (stats.level4Categories[categoryIdText].parentsIds) {
                                    var parentId1 = stats.level4Categories[categoryIdText].parentsIds[0];
                                    var parentId2 = stats.level4Categories[categoryIdText].parentsIds[1];
                                    var parentId3 = stats.level4Categories[categoryIdText].parentsIds[2];
                                    var categoryId = categoryIdText.split('_').pop();
                                    if (!isNaN(categoryId)) {
                                        var newStatsSubCategories3 = newStats.subCategories[parentId3].subCategories[parentId2].subCategories[parentId1];
                                        if (!newStatsSubCategories3.subCategories) {
                                            newStatsSubCategories3.subCategories = {};
                                        }
                                        newStatsSubCategories3.subCategories[categoryId] = stats.level4Categories[categoryIdText];
                                    }
                                } else {
                                    $log.error('stats - missing category parent ids for: ' + categoryIdText);
                                }
                            });  // categoryIdsText.forEach => level4Categories
                        }
                        return newStats;
                    });
                }

                function _getAvailableExercises(includeInProgress) {
                    var getAllExercisesProm = _getPersonalizationData();
                    var getUsedExercisesProm = ExerciseResultSrv.getExercisesStatusMap();
                    return $q.all([
                        getAllExercisesProm,
                        getUsedExercisesProm
                    ]).then(function (resArr) {
                        var availableExercises = {
                            availableCategories: []
                        };
                        var allExercises = resArr[0].personalizationContent;
                        var usedExercises = resArr[1];
                        var timeBundleKeys = Object.keys(allExercises);
                        // Goes through the different timeBundles and calls the filtering recursive function
                        angular.forEach(timeBundleKeys, function (timeBundle) {
                            availableExercises[timeBundle] = _filterAvailableExercisesRecursive(allExercises[timeBundle], usedExercises, includeInProgress);
                            availableExercises.availableCategories = availableExercises.availableCategories.concat(availableExercises[timeBundle].availableCategories);
                        });
                        return availableExercises;
                    });
                }

                /* _filterAvailableExercisesRecursive
                 * Main filtering function, goes through the different levels of categories recursively (from Personalization json)
                 * and removes the used exercises on each level */
                function _filterAvailableExercisesRecursive(allExercises, usedExercises, includeInProgress) {
                    var availableExercises = {
                        availableCategories: []
                    };
                    // Get the current level's categories
                    var categoryIds = Object.keys(allExercises);
                    angular.forEach(categoryIds, function (categoryId) {
                        categoryId = parseInt(categoryId, 10);
                        availableExercises[categoryId] = availableExercises[categoryId] || {};

                        // Remove the used exercises from the exercise list in the current category (level)
                        availableExercises[categoryId].exercises = _removeUsedExercises(allExercises[categoryId].exercises, usedExercises, includeInProgress);
                        // If we have available exercises for "categoryId", push "categoryId" to the available categories list
                        if (Object.keys(availableExercises[categoryId].exercises).length > 0) {
                            availableExercises.availableCategories.push(categoryId);
                        }
                        // Recursive call for the sub categories
                        availableExercises[categoryId].subCategories = _filterAvailableExercisesRecursive(allExercises[categoryId].subCategories, usedExercises, includeInProgress);
                        // Add the available categories of the current categoryId's subCategories
                        availableExercises.availableCategories = availableExercises.availableCategories.concat(availableExercises[categoryId].subCategories.availableCategories); // TODO - Does it concat
                    });
                    return availableExercises;
                }

                function _removeUsedExercises(allExercises, usedExercises, includeInProgress) {
                    var availableExercises = {};
                    var exerciseTypeIds = Object.keys(allExercises);
                    // Run through the different "exerciseTypeIds" in "allExercises"
                    angular.forEach(exerciseTypeIds, function (exerciseTypeId) {
                        exerciseTypeId = parseInt(exerciseTypeId, 10);
                        if (usedExercises[exerciseTypeId]) {
                            availableExercises[exerciseTypeId] = availableExercises[exerciseTypeId] || [];

                            var exerciseIds = Object.keys(allExercises[exerciseTypeId]);
                            // Run through the different "exerciseIds" in "allExercises" for the current "exerciseTypeId"
                            angular.forEach(exerciseIds, function (exerciseId) {
                                exerciseId = parseInt(exerciseId, 10);
                                var currUsedExercise = usedExercises[exerciseTypeId][exerciseId];
                                var exerciseAvailable = includeInProgress ?
                                (!currUsedExercise) || (currUsedExercise.status !== 2) : (!currUsedExercise) || (currUsedExercise.status !== 1 && currUsedExercise.status !== 2);
                                // If this "exerciseId"" is not the "usedExercises" list or it's status is not 1 / 2 (started / completed)
                                if (exerciseAvailable) {
                                    availableExercises[exerciseTypeId].push(exerciseId);
                                }
                            });
                            // If we didn't find any available exercises for the "exerciseTypeId" - remove this property from the available exercises object
                            if (availableExercises[exerciseTypeId].length === 0) {
                                delete availableExercises[exerciseTypeId];
                            }
                        } else {
                            availableExercises[exerciseTypeId] = allExercises[exerciseTypeId];
                        }
                    });
                    return availableExercises;
                }

                function _getPersonalizationData() {
                    var data = {
                        exerciseType: 'personalization'
                    };

                    return StorageRevSrv.getContent(data);
                }
            }
        );
})(angular);

