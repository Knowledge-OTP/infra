(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule',
        ['znk.infra.znkModule',
            'znk.infra.exerciseResult',
            'znk.infra.userContext',
            'pascalprecht.translate',
            'znk.infra.popUp']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.assignModule').factory('AssignContentEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['LESSON', 1, 'lesson'],
                ['PRACTICE', 2, 'practice']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('UserAssignModuleService',
        ["ZnkModuleService", "$q", "SubjectEnum", "ExerciseResultSrv", "ExerciseStatusEnum", "ExerciseTypeEnum", "EnumSrv", "$log", "InfraConfigSrv", "StudentContextSrv", "StorageSrv", "AssignContentEnum", "$rootScope", "exerciseEventsConst", "UtilitySrv", "ENV", "CategoryService", function (ZnkModuleService, $q, SubjectEnum, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv,
                  $log, InfraConfigSrv, StudentContextSrv, StorageSrv, AssignContentEnum, $rootScope,
                  exerciseEventsConst, UtilitySrv, ENV, CategoryService) {
            'ngInject';

            var userAssignModuleService = {};
            var registerEvents = {};

            var USER_ASSIGNMENTS_DATA_PATH = 'users/$$uid/assignmentsData';
            var USER_ASSIGNMENT_RES_PATH = 'users/$$uid/assignmentResults';
            var USER_MODULE_RES_PATH = 'users/$$uid/moduleResults';
            var MODULE_RES_PATH = 'moduleResults/';

            userAssignModuleService.assignModules = {};

            userAssignModuleService.assignModuleStatus = new EnumSrv.BaseEnum([
                ['UNLOCKED', ExerciseStatusEnum.NEW.enum, 'unlocked'],
                ['IN-PROGRESS', ExerciseStatusEnum.ACTIVE.enum, 'in progress'],
                ['COMPLETED', ExerciseStatusEnum.COMPLETED.enum, 'completed']
            ]);

            userAssignModuleService.assignType = {
                module: {
                    id: AssignContentEnum.LESSON.enum,
                    fbPath: 'moduleResults'
                },
                homework: {
                    id: AssignContentEnum.PRACTICE.enum,
                    fbPath: 'assignmentResults'
                }
            };

            userAssignModuleService.offExternalOnValue = function () {
                // todo: implement offEvent for registered events (registerEvents object), once the storage.offEvent will fixed
            };

            userAssignModuleService.registerExternalOnValueCB = function (userId, contentType, valueCB, changeCB) {
                valueCB.type = contentType;
                changeCB.type = contentType;
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    if (!registerEvents[userId]) {
                        registerEvents[userId] = {};
                    }

                    if (!registerEvents[userId][contentType]) {
                        registerEvents[userId][contentType] = {};
                    }

                    if (!registerEvents[userId][contentType].valueCB) {
                        registerEvents[userId][contentType].valueCB = [];
                    }
                    registerEvents[userId][contentType].valueCB.push(valueCB);

                    if (!registerEvents[userId][contentType].changeCB) {
                        registerEvents[userId][contentType].changeCB = [];
                    }
                    registerEvents[userId][contentType].changeCB.push({
                        cb: changeCB,
                        guids: []
                    });

                    var assignContentPath = _getAssignContentPath(contentType);
                    studentStorage.onEvent('value', 'users/' + userId + '/' + assignContentPath, onValueEventCB);
                });
            };

            userAssignModuleService.setUserAssignModules = function (moduleIds, userId, tutorId, contentType) {
                if (!angular.isArray(moduleIds)) {
                    var errMSg = 'UserAssignModuleService: 1st argument should be array of module ids';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function () {
                        return ExerciseResultSrv.getModuleResult(userId, moduleId, false, false, contentType).then(function (moduleResult) {
                            moduleResults[moduleId] = moduleResult;
                            return moduleResults;
                        });
                    });

                });
                return getProm.then(function () {
                    var saveProm = $q.when();
                    angular.forEach(moduleIds, function (moduleId) {
                        saveProm = saveProm.then(function () {
                            return ZnkModuleService.getModuleById(moduleId).then(function (moduleObj) {
                                if (!moduleResults[moduleId]) {
                                    moduleResults[moduleId] = ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                    moduleResults[moduleId].assignedTutorId = tutorId;
                                    // copy fields from module object to results object for future using
                                    moduleResults[moduleId].name = moduleObj.name;
                                    moduleResults[moduleId].desc = moduleObj.desc;
                                    moduleResults[moduleId].subjectId =
                                        (typeof moduleObj.subjectId === 'undefined' || moduleObj.subjectId === null) ?
                                            CategoryService.getCategoryLevel1ParentByIdSync(moduleObj.categoryId) :
                                            moduleObj.subjectId;
                                    moduleResults[moduleId].order = moduleObj.order;
                                    moduleResults[moduleId].exercises = moduleObj.exercises;
                                    moduleResults[moduleId].assignDate = Date.now();
                                }
                                moduleResults[moduleId].assign = true;
                                return ExerciseResultSrv.setModuleResult(moduleResults[moduleId], moduleId);
                            });
                        });
                    });

                    return saveProm.then(function () {
                        return moduleResults;
                    });
                });
            };

            userAssignModuleService.setAssignContent = function (userId, moduleId, contentType) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId, false, false, contentType).then(function (moduleResult) {
                    moduleResult.contentAssign = true;
                    return ExerciseResultSrv.setModuleResult(moduleResult, moduleId, contentType);
                });
            };

            userAssignModuleService.assignHomework = function (lastAssignmentType) {
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var homeworkObj = _buildHomeworkObj(lastAssignmentType);
                    studentStorage.set(USER_ASSIGNMENTS_DATA_PATH, homeworkObj);
                });
            };

            userAssignModuleService.registerToFinishExerciseEvents = function () {
                angular.forEach(exerciseEventsConst, function (eventTypeNameObj) {
                    $rootScope.$on(eventTypeNameObj.FINISH, function (eventData, exerciseContent, currentExerciseResult) {
                        updateAllHomeworkStatus(currentExerciseResult);
                    });
                });
            };

            function _getAssignContentPath(contentType) {
                switch (contentType) {
                    case userAssignModuleService.assignType.module.id:
                        return userAssignModuleService.assignType.module.fbPath;
                    case userAssignModuleService.assignType.homework.id:
                        return userAssignModuleService.assignType.homework.fbPath;
                }
            }

            function _getContentTypeByPath(path) {
                var newPath = path;
                if (path.indexOf('/') > -1) {
                    newPath = path.substr(path.lastIndexOf('/') + 1);
                }
                switch (newPath) {
                    case userAssignModuleService.assignType.module.fbPath:
                        return userAssignModuleService.assignType.module.id;
                    case userAssignModuleService.assignType.homework.fbPath:
                        return userAssignModuleService.assignType.homework.id;
                    case userAssignModuleService.assignType.homework.shortFbPath:
                        return userAssignModuleService.assignType.homework.id;
                }
            }

            function onValueEventCB(moduleResultsGuids, path) {
                var contentType = _getContentTypeByPath(path);
                if (angular.isUndefined(moduleResultsGuids) || !moduleResultsGuids) {
                    var userId = StudentContextSrv.getCurrUid();
                    userAssignModuleService.assignModules = {};
                    applyCB(registerEvents[userId][contentType].valueCB, contentType);
                    return;
                }
                buildResultsFromGuids(moduleResultsGuids, contentType);
            }

            function callbackWrapper(contentType) {
                return function () {
                    var userId = StudentContextSrv.getCurrUid();
                    ExerciseResultSrv.getUserModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                        buildResultsFromGuids(moduleResultsGuids, contentType);
                    });
                };
            }

            function buildResultsFromGuids(moduleResultsGuids, contentType) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var moduleResults = {};
                    var getPromArr = [];
                    var userId = StudentContextSrv.getCurrUid();
                    var moduleResultsToUpdate = [];

                    angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                        var moduleResultProm = getResultsByModuleId(userId, moduleId, contentType).then(function (moduleResult) {
                            var getModuleProm;
                            // If there is NOT subjectId on moduleResult add and update
                            if (typeof moduleResult.subjectId === 'undefined' || moduleResult.subjectId === null) {
                                getModuleProm = ZnkModuleService.getModuleById(moduleId, userId).then(moduleObj => {
                                    moduleResult.subjectId = (typeof moduleObj.subjectId === 'undefined' || moduleObj.subjectId === null) ?
                                        CategoryService.getCategoryLevel1ParentByIdSync(moduleObj.categoryId) : moduleObj.subjectId;
                                    moduleResultsToUpdate.push(moduleResult);
                                    return ExerciseResultSrv.updateModuleResult(moduleResult);
                                });
                            } else {
                                getModuleProm = Promise.resolve(moduleResult);
                            }
                            return getModuleProm.then(verifiedModuleResult => {
                                moduleResults[verifiedModuleResult.moduleId] = verifiedModuleResult;

                                angular.forEach(registerEvents[userId][contentType].changeCB, function (cbData) {
                                    if (cbData.guids.indexOf(verifiedModuleResult.guid) === -1) {
                                        cbData.guids.push(verifiedModuleResult.guid);
                                        if (contentType === AssignContentEnum.LESSON.enum) {
                                            studentStorage.onEvent('child_changed', 'moduleResults/' + verifiedModuleResult.guid, callbackWrapper(contentType));
                                        }
                                    }
                                });
                            });

                        });
                        getPromArr.push(moduleResultProm);
                    });

                    $q.all(getPromArr).then(function () {
                        userAssignModuleService.assignModules = moduleResults;
                        applyCB(registerEvents[userId][contentType].valueCB, contentType);
                    }).catch(function (err) {
                        $log.error('buildResultsFromGuids: Error ', err);
                    });
                });
            }

            function getResultsByModuleId(userId, moduleId, contentType) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId, false, true, contentType).then(function (moduleResult) {
                    if (moduleResult && !angular.equals(moduleResult, {})) {
                        moduleResult.moduleSummary = getModuleSummary(moduleResult);

                        InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                            angular.forEach(moduleResult.exerciseResults, function (exerciseTypeId) {
                                angular.forEach(exerciseTypeId, function (exercise) {
                                    var exerciseResultsPath = 'exerciseResults/' + exercise.guid;
                                    studentStorage.getAndBindToServer(exerciseResultsPath);
                                });
                            });
                        });
                    }
                    return moduleResult;
                });
            }

            function applyCB(cbArr, contentType) {
                angular.forEach(cbArr, function (valueCB) {
                    if (angular.isFunction(valueCB)) {
                        if (valueCB.type === contentType) {
                            valueCB(userAssignModuleService.assignModules);
                        }
                    }
                });
            }

            function getModuleSummary(assignModule) {
                var moduleSummary = {};
                var _exerciseResults = assignModule.exerciseResults;

                function newSummary() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        correctAnswersNum: 0,
                        wrongAnswersNum: 0,
                        skippedAnswersNum: 0,
                        totalAnswered: 0,
                        duration: 0
                    };
                }

                function newOverAll() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        totalCorrectAnswers: 0,
                        totalWrongAnswers: 0,
                        totalSkippedAnswers: 0,
                        totalDuration: 0
                    };
                }


                if (assignModule.exercises && assignModule.exercises.length) {

                    var moduleExerciseNum = 0;

                    angular.forEach(assignModule.exercises, function (exercise) {
                        var exerciseTypeId, exerciseId;

                        exerciseTypeId = exercise.exerciseTypeId;
                        exerciseId = exercise.exerciseId;

                        if (!moduleSummary[exerciseTypeId]) {
                            moduleSummary[exerciseTypeId] = {};
                        }
                        var currentExerciseRes;
                        if (!moduleSummary[exerciseTypeId][exerciseId]) {
                            currentExerciseRes = newSummary();
                        }

                        if (exercise.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
                            moduleExerciseNum++;
                        }

                        if (_exerciseResults && _exerciseResults[exerciseTypeId]) {
                            if (_exerciseResults[exerciseTypeId][exerciseId]) {
                                currentExerciseRes.status = _exerciseResults[exerciseTypeId][exerciseId].isComplete ?
                                    ExerciseStatusEnum.COMPLETED.enum :
                                    (_exerciseResults[exerciseTypeId][exerciseId].questionResults.length > 0 ? ExerciseStatusEnum.ACTIVE.enum : ExerciseStatusEnum.NEW.enum);

                                currentExerciseRes.correctAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].correctAnswersNum || 0;
                                currentExerciseRes.wrongAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].wrongAnswersNum || 0;
                                currentExerciseRes.skippedAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].skippedAnswersNum || 0;
                                currentExerciseRes.totalAnswered = currentExerciseRes.correctAnswersNum + currentExerciseRes.wrongAnswersNum;
                                currentExerciseRes.duration = _exerciseResults[exerciseTypeId][exerciseId].duration || 0;
                            }
                        }

                        if (!moduleSummary.overAll) {
                            moduleSummary.overAll = newOverAll();
                        }

                        var _overAll = moduleSummary.overAll;
                        _overAll.totalCorrectAnswers += currentExerciseRes.correctAnswersNum;
                        _overAll.totalWrongAnswers += currentExerciseRes.wrongAnswersNum;
                        _overAll.totalSkippedAnswers += currentExerciseRes.skippedAnswersNum;

                        moduleSummary[exerciseTypeId][exerciseId] = currentExerciseRes;
                    });

                    if (assignModule.exerciseResults.length) {

                        var completedExercises = 0, totalDuration = 0;

                        angular.forEach(assignModule.exerciseResults, function (exerciseType) {
                            angular.forEach(exerciseType, function (exerciseResults) {
                                if (exerciseResults.duration) {
                                    totalDuration += (exerciseResults.duration || 0);
                                }
                                if (exerciseResults.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
                                    if (exerciseResults.isComplete) {
                                        completedExercises++;
                                    }
                                }
                            });
                        });
                        moduleSummary.overAll.totalDuration = totalDuration;

                        if (moduleExerciseNum !== completedExercises) {
                            moduleSummary.overAll.status = ExerciseStatusEnum.ACTIVE.enum;
                        } else if (moduleExerciseNum === completedExercises) {
                            moduleSummary.overAll.status = ExerciseStatusEnum.COMPLETED.enum;
                            if (!assignModule.isComplete) {
                                _updateModuleResultToCompleted(assignModule.guid);
                            }
                        }
                    }
                }

                return moduleSummary;
            }

            function _buildHomeworkObj(lastAssignmentType) {
                return {
                    assignmentStartDate: StorageSrv.variables.currTimeStamp,
                    lastAssignmentType: lastAssignmentType,
                    assignmentResults: {}
                };

            }

            function _getAllModulesTypesResults() {
                var userAssignmentsResPath = USER_ASSIGNMENT_RES_PATH;
                var userModuleResPath = USER_MODULE_RES_PATH;
                if (ENV.appContext === 'dashboard') {
                    var uid = StudentContextSrv.getCurrUid();
                    userAssignmentsResPath = userAssignmentsResPath.replace('$$uid', uid);
                    userModuleResPath = userModuleResPath.replace('$$uid', uid);
                }
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return $q.all([
                        StudentStorageSrv.get(userAssignmentsResPath),
                        StudentStorageSrv.get(userModuleResPath)
                    ]).then(function (res) {
                        var promArr = [];
                        var moduleResultsArr = [];

                        var assignmentsResGuids = UtilitySrv.object.convertToArray(res[0]);
                        var moduleResultsGuids = UtilitySrv.object.convertToArray(res[1]);
                        var allModuleResultsGuids = moduleResultsGuids.concat(assignmentsResGuids);

                        angular.forEach(allModuleResultsGuids, function (moduleGuid) {
                            var prom = StudentStorageSrv.get(MODULE_RES_PATH + moduleGuid).then(function (moduleRes) {
                                moduleResultsArr.push(moduleRes);
                            });
                            promArr.push(prom);
                        });

                        return $q.all(promArr).then(function () {
                            return moduleResultsArr;
                        });
                    });
                });
            }

            function _updateModuleResultToCompleted(moduleResultGuid) {
                var path = MODULE_RES_PATH + moduleResultGuid + '/isComplete';
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    studentStorage.update(path, true);
                });
            }

            function _updateHomeworkStatus(moduleResult, currentExerciseResult) {
                var promoArr = [];
                var exercisesReultsArr = [];
                var dontInit = true;
                angular.forEach(moduleResult.exercises, function (exercise) {
                    var prom = ExerciseResultSrv.getExerciseResult(exercise.exerciseTypeId, exercise.exerciseId, exercise.examId, null, dontInit).then(function (exerciseRes) {
                        if (exerciseRes && exerciseRes.guid === currentExerciseResult.guid) {
                            exercisesReultsArr.push(currentExerciseResult);
                        } else {
                            if (exerciseRes) {
                                exercisesReultsArr.push(exerciseRes);
                            }
                        }
                    });
                    promoArr.push(prom);
                });

                $q.all(promoArr).then(function () {
                    if (moduleResult.exercises.length !== exercisesReultsArr.length) {
                        return;
                    }
                    for (var i = 0; i < exercisesReultsArr.length; i++) {
                        if (!exercisesReultsArr[i].isComplete) {
                            return;
                        }
                    }
                    _updateModuleResultToCompleted(moduleResult.guid);  // all module's exercises completed
                });
            }

            function updateAllHomeworkStatus(currentExerciseResult) {
                _getAllModulesTypesResults().then(function (allModulesTypesResults) {
                    for (var i = 0; i < allModulesTypesResults.length; i++) {
                        if (!allModulesTypesResults[i].isComplete && _isExerciseInExercisesArray(allModulesTypesResults[i].exercises, currentExerciseResult)) {
                            _updateHomeworkStatus(allModulesTypesResults[i], currentExerciseResult);
                        }
                    }
                });
            }

            function _isExerciseInExercisesArray(exercisesArr, exercises) {
                for (var i = 0; i < exercisesArr.length; i++) {
                    if (exercisesArr[i].exerciseId === exercises.exerciseId && exercisesArr[i].exerciseTypeId === exercises.exerciseTypeId) {
                        return true;
                    }
                }
                return false;
            }

            return userAssignModuleService;
        }]
    );
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').provider('HomeworkSrv',
        function () {

            var popupResolveFn = function ($state, AssignContentEnum) {
                'ngInject';
                return function () {
                    $state.go('app.eTutoring',
                        {viewId: AssignContentEnum.PRACTICE.enum},
                        {reload: true});
                };
            };
            popupResolveFn.$inject = ["$state", "AssignContentEnum"];

            this.setPopupResolveFn = function (fn) {
                popupResolveFn = fn;
            };

            this.$get = ["$q", "$log", "InfraConfigSrv", "PopUpSrv", "DueDateSrv", "$translate", "$rootScope", "exerciseEventsConst", "ExamSrv", "ENV", "ExerciseResultSrv", "ExamTypeEnum", "StorageSrv", "ExerciseTypeEnum", "$injector", "LiveSessionSubjectEnum", "$window", function ($q, $log, InfraConfigSrv, PopUpSrv, DueDateSrv, $translate, $rootScope, exerciseEventsConst, ExamSrv, ENV,
                                  ExerciseResultSrv, ExamTypeEnum, StorageSrv, ExerciseTypeEnum, $injector, LiveSessionSubjectEnum, $window) {
                'ngInject';

                var HomeworkSrv = {};
                var studentStorage = InfraConfigSrv.getStudentStorage();
                var ONE_WEEK_IN_MILLISECONDS = 604800000;

                var ASSIGNMENT_RES_PATH = 'users/$$uid/assignmentResults';
                var MODULE_RES_PATH = 'moduleResults/';
                var HW_POPUP_TIMEOUT = 'settings/assignments/assignmentPopupTimeout';
                var LOCAL_STORAGE_LAST_SEEN_HW_POPUP = 'lastSeenHwPopup';

                var completeAssignmentBtn = {
                    resolveVal: $injector.invoke(popupResolveFn)
                };

                var closeBtn = {};

                function _getStudentStorage() {
                    return studentStorage;
                }

                function _getGlobalStorage() {
                    return InfraConfigSrv.getGlobalStorage();
                }

                function _notCompletedHomeworkHandler(homeworkObj) {
                    var popupTitle = 'ASSIGN_MODULE.ASSIGNMENT_AVAILABLE';
                    var popupContent = 'ASSIGN_MODULE.ASSIGNMENT_PENDING';

                    var latePopupTitle = 'ASSIGN_MODULE.YOUR_ASSIGNMENT_IS_LATE';
                    var latePopupContent = 'ASSIGN_MODULE.PlEASE_COMPLETE_ASSIGNMENT';

                    var goToAssignmentText = 'ASSIGN_MODULE.ASSIGNMENT';
                    var closeText = 'ASSIGN_MODULE.CLOSE';

                    $window.localStorage.setItem(LOCAL_STORAGE_LAST_SEEN_HW_POPUP, new Date().getTime());

                    if (isHomeworkIsLate(homeworkObj)) {
                        $translate([latePopupTitle, latePopupContent, goToAssignmentText, closeText]).then(function (res) {
                            var title = res[latePopupTitle];
                            var content = res[latePopupContent];
                            completeAssignmentBtn.text = res[goToAssignmentText];
                            closeBtn.text = res[closeText];
                            PopUpSrv.basePopup('error-popup homework-popup', 'popup-exclamation-mark', title, content, [closeBtn, completeAssignmentBtn]);
                        });
                    } else {
                        $translate([popupTitle, popupContent, goToAssignmentText, closeText]).then(function (res) {
                            var title = res[popupTitle];
                            var content = res[popupContent];
                            completeAssignmentBtn.text = res[goToAssignmentText];
                            closeBtn.text = res[closeText];
                            PopUpSrv.basePopup('warning-popup homework-popup', 'popup-exclamation-mark', title, content, [closeBtn, completeAssignmentBtn]);
                        });
                    }

                }

                function _homeworkCB(){
                    _getGlobalStorage().then(function(globalStorage){
                        globalStorage.get(HW_POPUP_TIMEOUT).then(function(hwPopupTimeout){
                             var lastSeenHWPopup = $window.localStorage.getItem(LOCAL_STORAGE_LAST_SEEN_HW_POPUP);

                             if(!lastSeenHWPopup || new Date().getTime() - lastSeenHWPopup > hwPopupTimeout){
                                 _homeworkHandler();
                             }
                         });
                    });
                }

                function _homeworkHandler() {  //find the oldest not completed homework and show the relevant popup (late or regular hw)
                    var promArr = [];
                    var notCompletedHomeworkArr = [];
                    angular.forEach(LiveSessionSubjectEnum.getEnumArr(), function (topicObj) {
                        var prom = _getNotCompletedHomeworkByTopicId(topicObj.enum).then(function (notCompletedHomework) {
                            if (notCompletedHomework) {
                                notCompletedHomeworkArr.push(notCompletedHomework);
                            }
                        });
                        promArr.push(prom);
                    });

                    $q.all(promArr).then(function () {
                        if(notCompletedHomeworkArr.length === 0){
                            promArr = [];
                            return;
                        }

                        var theOldestHomework;
                        angular.forEach(notCompletedHomeworkArr, function (notCompletedHomework) {
                            if (!theOldestHomework || notCompletedHomework.assignDate < theOldestHomework.assignDate) {
                                theOldestHomework = notCompletedHomework;
                            }
                        });
                        _notCompletedHomeworkHandler(theOldestHomework);
                    });
                }

                function _getAllHomeworkModuleResult() {
                    return _getStudentStorage().then(function (studentStorage) {
                        var promArr = [];
                        var moduleResArr = [];
                        return studentStorage.get(ASSIGNMENT_RES_PATH).then(function (hwModuleResultsGuids) {
                            angular.forEach(hwModuleResultsGuids, function (moduleGuid) {
                                var prom = studentStorage.get(MODULE_RES_PATH + moduleGuid).then(function (moduleRes) {
                                    moduleResArr.push(moduleRes);
                                });
                                promArr.push(prom);
                            });

                            return $q.all(promArr).then(function () {
                                return moduleResArr;
                            });
                        });
                    });
                }

                function _getNotCompletedHomeworkByTopicId(topicIds) {
                    return _getAllHomeworkModuleResult().then(function (allHomeworkModulesResults) {
                        for (var i = 0; i < allHomeworkModulesResults.length; i++) {
                            var topicIdsArr = angular.isArray(topicIds) ? topicIds : [topicIds];
                            if (!allHomeworkModulesResults[i].isComplete && topicIdsArr.indexOf(allHomeworkModulesResults[i].topicId) !== -1) {
                                return allHomeworkModulesResults[i];
                            }
                        }
                    });
                }

                function isHomeworkIsLate(homeworkObj) {
                    var dueDate = homeworkObj.assignDate + ONE_WEEK_IN_MILLISECONDS;
                    var isDueDateObj = DueDateSrv.isDueDatePass(dueDate);
                    if (isDueDateObj.passDue) {
                        return true;
                    }
                    return false;
                }

                HomeworkSrv.homeworkPopUpReminder = function (uid) {
                    var homeworkPath = 'users/$$uid/assignmentResults';
                    homeworkPath = homeworkPath.replace('$$uid', uid);
                    return _getStudentStorage().then(function (userStorage) {
                        userStorage.onEvent('value', homeworkPath, _homeworkCB);
                    });
                };

                HomeworkSrv.hasLatePractice = function (topicId) {
                    return _getNotCompletedHomeworkByTopicId(topicId).then(function (notCompletedHomework) {
                        if (angular.isDefined(notCompletedHomework)) {
                            return isHomeworkIsLate(notCompletedHomework);
                        } else {
                            return false;
                        }
                    });
                };

                return HomeworkSrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.assignModule').run(['$templateCache', function ($templateCache) {

}]);
