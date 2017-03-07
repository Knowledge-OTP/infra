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

            this.setPopupResolveFn = function (fn) {
                popupResolveFn = fn;
            };

            var topicsArray;
            this.setTopicsArray = function (_topicsArray) {
                topicsArray = _topicsArray;
            };

            var diagnosticExamId;
            this.setDiagnosticExamId = function (id) {
                diagnosticExamId = id;
            };

            this.$get = function ($q, $log, InfraConfigSrv, PopUpSrv, DueDateSrv, $translate, $rootScope, exerciseEventsConst, ExamSrv, ENV,
                                  ExerciseResultSrv, ExamTypeEnum, StorageSrv, ExerciseTypeEnum, $injector, LiveSessionSubjectEnum, $window) {
                'ngInject';

                var HomeworkSrv = {};
                var studentStorage = InfraConfigSrv.getStudentStorage();
                var ONE_WEEK_IN_MILLISECONDS = 604800000;

                var ASSIGNMENTS_DATA_PATH = 'users/$$uid/assignmentsData';
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

                function _finishedSectionHandler(eventData, exerciseContent, currentExerciseResult) {
                    return ExamSrv.getExam(currentExerciseResult.examId).then(function (exam) {
                        var sectionsResults = [];
                        var promArr = [];
                        var dontInit = true;

                        if (exam.typeId !== ExamTypeEnum.MINI_TEST.enum || (angular.isDefined(diagnosticExamId) && exam.id === diagnosticExamId)) {
                            return;
                        }
                        angular.forEach(exam.sections, function (section) {
                            var prom = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, section.id, section.examId, null, dontInit).then(function (sectionResult) {
                                if (currentExerciseResult.exerciseId === section.id) {
                                    sectionsResults.push(currentExerciseResult);
                                } else {
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
            };
        }
    );
})(angular);
