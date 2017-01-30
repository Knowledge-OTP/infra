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
        ["ZnkModuleService", "$q", "SubjectEnum", "ExerciseResultSrv", "ExerciseStatusEnum", "ExerciseTypeEnum", "EnumSrv", "$log", "InfraConfigSrv", "StudentContextSrv", "StorageSrv", "AssignContentEnum", "$rootScope", "exerciseEventsConst", "UtilitySrv", function (ZnkModuleService, $q, SubjectEnum, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv,
                  $log, InfraConfigSrv, StudentContextSrv, StorageSrv, AssignContentEnum, $rootScope,
                  exerciseEventsConst, UtilitySrv) {
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
                    fbPath: 'assignmentResults',
                }
            };

            userAssignModuleService.offExternalOnValue = function () {
                /*InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                 var assignContentPath = _getAssignContentPath(valueCB.type);
                 studentStorage.offEvent('value', 'users/' + userId + '/' + assignContentPath, onValueEventCB);
                 angular.forEach(registerEvents[userId], function (cbArr, contentType) {
                 angular.forEach(registerEvents[userId][contentType].valueCB, function (cb, index) {
                 if (cb === valueCB) {
                 registerEvents[userId][contentType].valueCB.splice(index, 1);
                 }
                 });
                 });

                 angular.forEach(registerEvents[userId], function (cbArr, contentType) {
                 if (registerEvents[userId][contentType].changeCB) {
                 angular.forEach(registerEvents[userId][contentType].changeCB, function (cbData, index) {
                 if (cbData.cb === changeCB) {
                 angular.forEach(cbData.guids, function (resultGuid) {
                 var assignContentPath = _getAssignContentPath(changeCB.type);
                 studentStorage.offEvent('child_changed', assignContentPath + '/'+ resultGuid, function () {
                 // need to OFF inner callbackWrapper function (need to name the function)
                 });
                 });
                 registerEvents[userId][contentType].changeCB.splice(index, 1);
                 }
                 });
                 }
                 });
                 });*/
            };

            userAssignModuleService.registerExternalOnValueCB = function (userId, contentType, valueCB, changeCB) {
                valueCB.type = contentType;
                changeCB.type = contentType;
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    if (!registerEvents[userId]) {
                        registerEvents[userId] = {};
                    }

                    if(!registerEvents[userId][contentType]){
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
                                    moduleResults[moduleId].subjectId = moduleObj.subjectId;
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
                return ExerciseResultSrv.getModuleResult(userId, moduleId,  false, false, contentType).then(function (moduleResult) {
                    moduleResult.contentAssign = true;
                    return ExerciseResultSrv.setModuleResult(moduleResult, moduleId, contentType);
                });
            };

            userAssignModuleService.assignHomework = function(lastAssignmentType){
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var homeworkObj = _buildHomeworkObj(lastAssignmentType);
                    studentStorage.set(USER_ASSIGNMENTS_DATA_PATH,homeworkObj);
                });
            };

            userAssignModuleService.registerToFinishExerciseEvents = function() {
                angular.forEach(exerciseEventsConst,function(eventTypeNameObj){
                    $rootScope.$on(eventTypeNameObj.FINISH, function(eventData, exerciseContent, currentExerciseResult){
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
                if(path.indexOf('/') > -1) {
                    newPath = path.substr(path.lastIndexOf('/')+1);
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

                    angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                        var getProm = getResultsByModuleId(userId, moduleId, contentType).then(function (moduleResult) {
                            moduleResults[moduleResult.moduleId] = moduleResult;

                            angular.forEach(registerEvents[userId][contentType].changeCB, function (cbData) {
                                if (cbData.guids.indexOf(moduleResult.guid) === -1) {
                                    cbData.guids.push(moduleResult.guid);
                                    studentStorage.onEvent('child_changed', 'moduleResults/' + moduleResult.guid, callbackWrapper(contentType));
                                }
                            });
                        });
                        getPromArr.push(getProm);
                    });

                    $q.all(getPromArr).then(function () {
                        userAssignModuleService.assignModules = moduleResults;
                        applyCB(registerEvents[userId][contentType].valueCB, contentType);
                    }).catch(function (err) {
                        $log.error('buildResultsFromGuids: Error ' , err);
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
                        if(valueCB.type === contentType){
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

                        if (!moduleSummary[exerciseTypeId]){
                            moduleSummary[exerciseTypeId] = {};
                        }
                        var currentExerciseRes;
                        if (!moduleSummary[exerciseTypeId][exerciseId]){
                            currentExerciseRes = newSummary();
                        }

                        if (exercise.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
                            moduleExerciseNum++;
                        }

                        if (_exerciseResults && _exerciseResults[exerciseTypeId]) {
                            if (_exerciseResults[exerciseTypeId][exerciseId]){

                                if (exercise.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
                                    currentExerciseRes.status = _exerciseResults[exerciseTypeId][exerciseId].isComplete ?
                                        ExerciseStatusEnum.COMPLETED.enum :
                                        (_exerciseResults[exerciseTypeId][exerciseId].questionResults.length > 0 ? ExerciseStatusEnum.ACTIVE.enum : ExerciseStatusEnum.NEW.enum);

                                    currentExerciseRes.correctAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].correctAnswersNum || 0;
                                    currentExerciseRes.wrongAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].wrongAnswersNum || 0;
                                    currentExerciseRes.skippedAnswersNum = _exerciseResults[exerciseTypeId][exerciseId].skippedAnswersNum || 0;
                                    currentExerciseRes.totalAnswered = currentExerciseRes.correctAnswersNum + currentExerciseRes.wrongAnswersNum;
                                }
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

                        var completedExercises = 0, totalDuration=0;

                        angular.forEach(assignModule.exerciseResults, function (exerciseType) {
                            angular.forEach(exerciseType, function (exerciseResults) {
                                if (exerciseResults.duration) {
                                    totalDuration += (exerciseResults.duration || 0);
                                }
                                if(exerciseResults.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum) {
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
                        }
                    }
                }

                return moduleSummary;
            }

            function _buildHomeworkObj(lastAssignmentType){
                return {
                    assignmentStartDate:  StorageSrv.variables.currTimeStamp,
                    lastAssignmentType : lastAssignmentType,
                    assignmentResults: {}
                };

            }

            function _getAllModulesTypesResults () {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return $q.all([
                        StudentStorageSrv.get(USER_ASSIGNMENT_RES_PATH),
                        StudentStorageSrv.get(USER_MODULE_RES_PATH)
                    ]).then(function(res){
                        var promArr = [];
                        var moduleResultsArr = [];

                        var assignmentsResGuids = UtilitySrv.object.convertToArray(res[0]);
                        var moduleResultsGuids = UtilitySrv.object.convertToArray(res[1]);
                        var allModuleResultsGuids = moduleResultsGuids.concat(assignmentsResGuids);

                        angular.forEach(allModuleResultsGuids,function(moduleGuid){
                            var prom = StudentStorageSrv.get(MODULE_RES_PATH + moduleGuid).then(function(moduleRes){
                                moduleResultsArr.push(moduleRes);
                            });
                            promArr.push(prom);
                        });

                        return $q.all(promArr).then(function(){
                            return moduleResultsArr;
                        });
                    });
                });
            }

            function _updateModuleResultToCompleted(moduleResultGuid){
                var path = MODULE_RES_PATH + moduleResultGuid + '/isComplete';
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    studentStorage.update(path, true);
                });
            }

            function _updateHomeworkStatus(moduleResult, currentExerciseResult){
                var promoArr = [];
                var exercisesReultsArr = [];
                var dontInit = true;
                angular.forEach(moduleResult.exercises, function(exercise){
                    var prom = ExerciseResultSrv.getExerciseResult(exercise.exerciseTypeId, exercise.exerciseId, exercise.examId, null, dontInit).then(function(exerciseRes){
                        if(exerciseRes && exerciseRes.guid === currentExerciseResult.guid){
                            exercisesReultsArr.push(currentExerciseResult);
                        } else {
                            if(exerciseRes){
                                exercisesReultsArr.push(exerciseRes);
                            }
                        }
                    });
                    promoArr.push(prom);
                });

                $q.all(promoArr).then(function(){
                    if(moduleResult.exercises.length !== exercisesReultsArr.length) {
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

            function updateAllHomeworkStatus (currentExerciseResult) {
                _getAllModulesTypesResults().then(function(allModulesTypesResults){
                    for(var i = 0 ; i < allModulesTypesResults.length; i++){
                        if(!allModulesTypesResults[i].isComplete && _isExerciseInExercisesArray(allModulesTypesResults[i].exercises, currentExerciseResult)){
                            _updateHomeworkStatus(allModulesTypesResults[i],currentExerciseResult);
                        }
                    }
                });
            }

            function _isExerciseInExercisesArray(exercisesArr, exercises){
                for(var i = 0 ; i < exercisesArr.length; i++){
                    if(exercisesArr[i].exerciseId === exercises.exerciseId && exercisesArr[i].exerciseTypeId === exercises.exerciseTypeId){
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

            var topicsArray;

            this.setTopicsArray = function (_topicsArray) {
                topicsArray = _topicsArray;
            };

            this.$get = ["$q", "$log", "InfraConfigSrv", "PopUpSrv", "DueDateSrv", "$translate", "$rootScope", "exerciseEventsConst", "ExamSrv", "ExerciseResultSrv", "ExamTypeEnum", "StorageSrv", "ExerciseTypeEnum", "$injector", function ($q, $log, InfraConfigSrv, PopUpSrv, DueDateSrv, $translate, $rootScope, exerciseEventsConst, ExamSrv,
                                  ExerciseResultSrv, ExamTypeEnum, StorageSrv, ExerciseTypeEnum, $injector) {
                'ngInject';

                var HomeworkSrv = {};
                var studentStorage = InfraConfigSrv.getStudentStorage();
                var ONE_WEEK_IN_MILLISECONDS = 604800000;

                var ASSIGNMENTS_DATA_PATH = 'users/$$uid/assignmentsData';
                var ASSIGNMENT_RES_PATH = 'users/$$uid/assignmentResults';
                var MODULE_RES_PATH = 'moduleResults/';

                var completeAssignmentBtn = {
                    resolveVal: $injector.invoke(popupResolveFn)
                };

                var closeBtn = {};

                function _getStudentStorage() {
                    return studentStorage;
                }

                function _notCompletedHomeworkHandler(homeworkObj) {
                    var popupTitle = 'ASSIGN_MODULE.ASSIGNMENT_AVAILABLE';
                    var popupContent = 'ASSIGN_MODULE.ASSIGNMENT_PENDING';

                    var latePopupTitle = 'ASSIGN_MODULE.YOUR_ASSIGNMENT_IS_LATE';
                    var latePopupContent = 'ASSIGN_MODULE.PlEASE_COMPLETE_ASSIGNMENT';

                    var goToAssignmentText = 'ASSIGN_MODULE.ASSIGNMENT';
                    var closeText = 'ASSIGN_MODULE.CLOSE';

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

                function _homeworkHandler(homework) {
                    getNotCompletedHomework(homework).then(function (notCompletedHomework) {
                        if (notCompletedHomework) {
                            _notCompletedHomeworkHandler(notCompletedHomework);
                        }
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

                function getNotCompletedHomework() {
                    return _getAllHomeworkModuleResult().then(function (allHomeworkModulesResults) {
                        for (var i = 0; i < allHomeworkModulesResults.length; i++) {
                            if (!allHomeworkModulesResults[i].isComplete) {
                                return allHomeworkModulesResults[i];
                            }
                        }
                    });
                }

            function _finishedSectionHandler(eventData, exerciseContent, currentExerciseResult){
                return ExamSrv.getExam(currentExerciseResult.examId).then(function (exam) {
                    var sectionsResults = [];
                    var promArr = [];
                    var dontInit = true;
                    if(exam.typeId !== ExamTypeEnum.MINI_TEST.enum){
                        return;
                    }
                    angular.forEach(exam.sections, function (section) {
                        var prom = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, section.id, section.examId, null, dontInit).then(function(sectionResult){
                            if(currentExerciseResult.exerciseId === section.id){
                                sectionsResults.push(currentExerciseResult);
                            } else{
                                sectionsResults.push(sectionResult);
                            }
                        });
                        promArr.push(prom);
                    });

                        $q.all(promArr).then(function () {
                            for (var i = 0; i < sectionsResults.length; i++) {
                                if (sectionsResults[i] === null || !sectionsResults[i].isComplete) {
                                    return;
                                }
                            }
                            _getStudentStorage().then(function (studentStorage) {
                                if (!angular.isArray(topicsArray)) {
                                    $log.error('HomeworkSrv: topics must be array!');
                                }

                                var homeworkObj = {};
                                angular.forEach(topicsArray, function (topicId) {
                                    homeworkObj[topicId] = {
                                        assignmentStartDate: StorageSrv.variables.currTimeStamp
                                    };
                                });
                                studentStorage.set(ASSIGNMENTS_DATA_PATH, homeworkObj);
                            });
                        });
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
                        userStorage.onEvent('value', homeworkPath, _homeworkHandler);
                    });
                };

                HomeworkSrv.hasLatePractice = function () {
                    return getNotCompletedHomework().then(function(notCompletedHomework){
                        if (angular.isDefined(notCompletedHomework)) {
                            return isHomeworkIsLate(notCompletedHomework);
                        } else {
                            return false;
                        }
                    });
                };

                HomeworkSrv.assignHomework = function () {
                    return _getStudentStorage().then(function (studentStorage) {
                        return studentStorage.get(ASSIGNMENTS_DATA_PATH).then(function (assignment) {
                            if (angular.equals({}, assignment) || angular.isUndefined(assignment) || assignment === null) {
                                $rootScope.$on(exerciseEventsConst.section.FINISH, _finishedSectionHandler);
                            }
                        });
                    });
                };

                return HomeworkSrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);
