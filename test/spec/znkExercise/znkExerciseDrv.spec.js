describe('testing directive "znkExerciseDrv":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.znkExercise', 'htmlTemplates', 'analytics.mock'));

    beforeEach(function () {
        module(function ($provide) {
            $provide.constant('ENV', {
                appContext: 'student'
            });
        });
    });

    //get dependencies
    var $rootScope, $compile, $timeout, $interval, ZnkExerciseSrv, $q, ZnkExerciseViewModeEnum,
        ZnkExerciseSlideDirectionEnum, ZnkExerciseEvents;
    beforeEach(inject([
        '$rootScope', '$compile', '$timeout', '$injector',
        function (_$rootScope, _$compile, _$timeout, $injector) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            $timeout = _$timeout;
            $interval = $injector.get('$interval');
            ZnkExerciseSrv = $injector.get('ZnkExerciseSrv');
            $q = $injector.get('$q');
            ZnkExerciseViewModeEnum = $injector.get('ZnkExerciseViewModeEnum');
            ZnkExerciseSlideDirectionEnum = $injector.get('ZnkExerciseSlideDirectionEnum');
            ZnkExerciseEvents = $injector.get('ZnkExerciseEvents');
        }
    ]));

    function createDirectiveHtml($scope, content, scopeSettings, scopeAnswers) {
        if (!$scope) {
            $scope = $rootScope.$new();
            $scope.d = {
                questions: [
                    {
                        id: 1,
                        groupDataType: 1,
                        answers: [{id: 1, content: 'answer 1'}, {id: 2, content: 'answer 2'}, {
                            id: 3,
                            content: 'answer 3'
                        }, {id: 4, content: 'answer 4'}]
                    },
                    {id: 2, groupDataType: 1, correctAnswer: [{content: 'answer 2'}]},
                    {
                        id: 3,
                        groupDataType: 1,
                        answers: [{id: 1, content: 'answer 1'}, {id: 2, content: 'answer 2'}, {
                            id: 3,
                            content: 'answer 3'
                        }, {id: 4, content: 'answer 4'}]
                    },
                    {id: 4, groupDataType: 1, correctAnswer: [{content: '45'}]},
                    {
                        id: 5,
                        groupDataType: 1,
                        answers: [{id: 1, content: 'answer 1'}, {id: 2, content: 'answer 2'}, {
                            id: 3,
                            content: 'answer 3'
                        }, {id: 4, content: 'answer 4'}]
                    }
                ],
                answers: scopeAnswers || [
                    {
                        questionId: 1,
                        userAnswer: 3,
                        bookmark: true,
                        blackboardData: 'blackboardData'
                    },
                    {questionId: 2, userAnswer: 'answer 4'},
                    {questionId: 3},
                    {questionId: 4, userAnswer: '45'},
                    {questionId: 5}
                ],
                settings: scopeSettings || {
                    allowedTimeForExercise: 20000
                },
                articles: []
            };
        }

        if (!content) {
            content =
                '<znk-exercise ' +
                'ng-model="d.answers" ' +
                'questions="d.questions" ' +
                'settings="d.settings" ' +
                'actions="d.actions">' +
                '</znk-exercise>';
        }

        content = $compile(content)($scope);

        content.getNgModelCtrl = function () {
            return content.data().$ngModelController;
        };

        content.getZnkExerciseDrvCtrl = function () {
            return content.data().$znkExerciseController;
        };

        content.next = function () {
            content.setCurrentIndexByOffset(1);
        };

        content.bookmark = function () {
            var isolateScope = this.isolateScope();
            isolateScope.vm.bookmarkCurrentQuestion();
            isolateScope.$digest();
        };

        content.setCurrentIndex = function (index) {
            var isolateScope = content.isolateScope();
            isolateScope.vm.setCurrentIndex(index);
            isolateScope.$digest();
            $timeout.flush(300);
        };

        content.setCurrentIndexByOffset = function (offset) {
            var isolateScope = this.isolateScope();
            isolateScope.vm.setCurrentIndexByOffset(offset);
            isolateScope.$digest();
            $timeout.flush(300);
        };

        content.getSlideLeftBtnElement = function () {
            var domElem = content[0];
            return angular.element(domElem.querySelector('.btn-container.left-container'));
        };

        content.getSlideRightBtnElement = function () {
            var domElem = content[0];
            return angular.element(domElem.querySelector('.btn-container.right-container'));
        };

        content.getBtnSectionScope = function(){
            var domElem = content[0];
            return angular.element(domElem.querySelector('znk-exercise-btn-section')).isolateScope();
        };

        //wait for the slide box to compile the questions
        $scope.$digest();
        $timeout.flush();

        return {
            scope: $scope,
            isolateScope: content.isolateScope(),
            content: content
        };
    }

    function sortArrById(item1, item2) {
        return item1.id - item2.id;
    }

    it('given btn section and question builder ready then znkExerciseDrvCtrl.isExerciseReady promise should return true', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var znkExerciseCtrl = content.getZnkExerciseDrvCtrl();

        var isExerciseReady;
        znkExerciseCtrl.isExerciseReady().then(function () {
            isExerciseReady = true;
        });
        scopeContent.scope.$digest();

        expect(isExerciseReady).toBeTruthy();
    });

    it('given formatter combining questions with answers has finish when executing isExerciseReady ' +
        'function then true should be returned', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var znkExerciseCtrl = content.getZnkExerciseDrvCtrl();
        var isExerciseReady = znkExerciseCtrl.isExerciseReady();
        expect(isExerciseReady).toBeTruthy();
    });

    it('when questions and model are provided then view value should be transformed to one object which contain ' +
        'array of object which contain both question and answer', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var ngModelCrl = content.getNgModelCtrl();
        var expectedQuestionsCombinedWithAnswerArr = [
            {
                id: 1,
                __questionStatus: {
                    questionId: 1,
                    userAnswer: 3,
                    bookmark: true,
                    index: 0,
                    blackboardData: 'blackboardData'
                },
                answers: [
                    {
                        id: 1,
                        content: 'answer 1'
                    },
                    {
                        id: 2,
                        content: 'answer 2'
                    },
                    {
                        id: 3,
                        content: 'answer 3'
                    },
                    {
                        id: 4,
                        content: 'answer 4'
                    }
                ]
            },
            {
                id: 2,
                __questionStatus: {
                    questionId: 2,
                    userAnswer: 'answer 4',
                    index: 1
                }
            },
            {
                id: 3,
                __questionStatus: {
                    questionId: 3,
                    index: 2
                },
                answers: [
                    {
                        id: 1,
                        content: 'answer 1'
                    },
                    {
                        id: 2,
                        content: 'answer 2'
                    },
                    {
                        id: 3,
                        content: 'answer 3'
                    },
                    {
                        id: 4,
                        content: 'answer 4'
                    }
                ]
            },
            {
                id: 4,
                __questionStatus: {
                    questionId: 4,
                    userAnswer: '45',
                    index: 3
                }
            },
            {
                id: 5,
                __questionStatus: {
                    questionId: 5,
                    index: 4
                },
                answers: [
                    {
                        id: 1,
                        content: 'answer 1'
                    },
                    {
                        id: 2,
                        content: 'answer 2'
                    },
                    {
                        id: 3,
                        content: 'answer 3'
                    },
                    {
                        id: 4,
                        content: 'answer 4'
                    }
                ]
            }
        ];
        expectedQuestionsCombinedWithAnswerArr.sort(sortArrById);
        ngModelCrl.$viewValue.sort(sortArrById);
        var i = 0;
        var viewValueItem = ngModelCrl.$viewValue[i];
        var expectedItem = expectedQuestionsCombinedWithAnswerArr[i];
        expect(viewValueItem.__questionStatus).toEqual(jasmine.objectContaining(expectedItem.__questionStatus));
        expect(viewValueItem.answers).toEqual(expectedItem.answers);
    });

    it('when znkExerciseDrv is built then actions object should be provided', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        expect(scope.d.actions.getCurrentIndex).toBeDefined();
        expect(scope.d.actions.setSlideIndex).toBeDefined();
        expect(scope.d.actions.finishExercise).toBeDefined();
    });

    it('when go to next function invoked then scope.d.settings.onNext function should be invoked as well', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        spyOn(scope.d.settings, 'onSlideChange');
        var content = scopeContent.content;
        content.next();
        expect(scope.d.settings.onSlideChange).toHaveBeenCalled();
    });

    it('when clicking on bookmark icon then the question should be bookmarked', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        var questionId = scope.d.questions[0].id;
        var answerIndex, initState;
        for (var i in scope.d.answers) {
            if (scope.d.answers[i].questionId === questionId) {
                answerIndex = i;
                initState = scope.d.answers[i].bookmark;
            }
        }
        content.bookmark();
        expect(!!scope.d.answers[answerIndex].bookmark).toBe(!initState);
        content.bookmark();
        expect(!!scope.d.answers[answerIndex].bookmark).toBe(!!initState);
    });

    it('when 5000 second is passed then the time spend on question property should be increased by 5 seconds', function () {
        var time = 1;
        Date.now = function () {
            return time;
        };
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        //var content = scopeContent.content;
        time += 5000;
        scope.d.actions.finishExercise();
        expect(scope.d.answers[0].timeSpent).toBe(5000);
    });

    it('given review mode when 3000 second is passed then the time spend on question property should not be increased', function () {
        var scopeContent = createDirectiveHtml(null, null, {viewMode: ZnkExerciseViewModeEnum.REVIEW.enum});
        var scope = scopeContent.scope;
        var initSpentTime = scope.d.answers[0].timeSpent;
        $interval.flush(5000);
        expect(scope.d.answers[0].timeSpent).toBe(initSpentTime);
    });

    xit('when blackboard tool is opened then it data should be set with current question black board data', function () {
        var modalSettings;
        ZnkExerciseSrv.openExerciseToolBoxModal = function (_modalSettings) {
            modalSettings = _modalSettings;
            modalSettings.actions = {
                setToolValue: function () {
                }
            };
        };
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var scope = scopeContent.scope;
        spyOn(modalSettings.actions, 'setToolValue');
        modalSettings.events.onToolOpened({tool: ZnkExerciseSrv.toolBoxTools.BLACKBOARD});
        var ngModelCtrl = content.getNgModelCtrl();
        expect(modalSettings.actions.setToolValue).toHaveBeenCalledWith(ZnkExerciseSrv.toolBoxTools.BLACKBOARD, scope.d.answers[0].blackboardData);
    });

    xit('when blackboard tool is closed then it data should be saved in current question black board data', function () {
        var modalSettings;
        ZnkExerciseSrv.openExerciseToolBoxModal = function (_modalSettings) {
            modalSettings = _modalSettings;
            modalSettings.actions = {
                setToolValue: function () {
                }
            };
        };
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        var newBlackBoardData = 'new blackboard data';
        modalSettings.events.onToolClosed({tool: ZnkExerciseSrv.toolBoxTools.BLACKBOARD, value: newBlackBoardData});
        expect(scope.d.answers[0].blackboardData).toBe(newBlackBoardData);
    });

    xit('when slide is changed then bookmark tool value should be set', function () {
        var modalSettings;
        ZnkExerciseSrv.openExerciseToolBoxModal = function (_modalSettings) {
            modalSettings = _modalSettings;
            modalSettings.actions = {
                setToolValue: function () {
                }
            };
            spyOn(modalSettings.actions, 'setToolValue');
        };
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        expect(modalSettings.actions.setToolValue).toHaveBeenCalledWith(ZnkExerciseSrv.toolBoxTools.BOOKMARK, scope.d.answers[0].bookmark);
        content.next();
        expect(modalSettings.actions.setToolValue).toHaveBeenCalledWith(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!scope.d.answers[1].bookmark);
    });

    xit('when clicking on bookmark tool in tool box modal then question bookmark should be reversed', function () {
        var modalSettings;
        ZnkExerciseSrv.openExerciseToolBoxModal = function (_modalSettings) {
            modalSettings = _modalSettings;
            modalSettings.actions = {
                setToolValue: function () {
                }
            };
            spyOn(modalSettings.actions, 'setToolValue');
        };
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var initBookmarkValue = scope.d.answers[0].bookmark;
        modalSettings.events.onToolValueChanged({
            tool: ZnkExerciseSrv.toolBoxTools.BOOKMARK,
            value: !initBookmarkValue
        });
        expect(!!scope.d.answers[0].bookmark).toBe(!initBookmarkValue);
        initBookmarkValue = scope.d.answers[0].bookmark;
        modalSettings.events.onToolValueChanged({
            tool: ZnkExerciseSrv.toolBoxTools.BOOKMARK,
            value: !initBookmarkValue
        });
        expect(!!scope.d.answers[0].bookmark).toBe(!initBookmarkValue);
    });

    it('given question change resolver not resolved when trying to set current question index then it should not be set', function () {
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var initIndex = isolateScope.vm.getCurrentIndex();

        var defer = $q.defer();
        isolateScope.vm.addQuestionChangeResolver(defer.promise);

        isolateScope.vm.setCurrentIndex(3);
        $rootScope.$digest();

        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(initIndex);
    });

    it('given question change resolver is resolved when trying to set current question index then it should be set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var initIndex = isolateScope.vm.getCurrentIndex();

        var defer = $q.defer();
        defer.resolve(true);
        isolateScope.vm.addQuestionChangeResolver(defer.promise);

        content.setCurrentIndex(3);
        $rootScope.$digest();

        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(3);
    });

    it('given 2 question change resolver were added and one of them is not resolved when trying to set current question ' +
        'index then it should not be set',
        function () {
            var scopeContent = createDirectiveHtml();
            var isolateScope = scopeContent.isolateScope;
            var initIndex = isolateScope.vm.getCurrentIndex();
            var content = scopeContent.content;

            var defer = $q.defer();
            defer.resolve(true);
            isolateScope.vm.addQuestionChangeResolver(defer.promise);
            defer = $q.defer();
            isolateScope.vm.addQuestionChangeResolver(defer.promise);

            content.setCurrentIndex(3);
            $rootScope.$digest();

            var currentIndex = isolateScope.vm.getCurrentIndex();
            expect(currentIndex).toBe(initIndex);
        }
    );

    it('given 2 question change resolver were added and both of them resolved when trying to set current question ' +
        'index then it should be set',
        function () {
            var scopeContent = createDirectiveHtml();
            var isolateScope = scopeContent.isolateScope;
            var initIndex = isolateScope.vm.getCurrentIndex();
            var content = scopeContent.content;

            var defer = $q.defer();
            defer.resolve(true);
            isolateScope.vm.addQuestionChangeResolver(defer.promise);
            defer = $q.defer();
            defer.resolve(true);
            isolateScope.vm.addQuestionChangeResolver(defer.promise);

            content.setCurrentIndex(3);
            $rootScope.$digest();

            var currentIndex = isolateScope.vm.getCurrentIndex();
            expect(currentIndex).toBe(3);
        }
    );

    it('when trying to set current question by offset then it should be set', function () {
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var content = scopeContent.content;

        content.setCurrentIndexByOffset(1);
        $rootScope.$digest();
        var expectedResult = 1;
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(expectedResult);
    });

    it('when trying to set current question by offset to negative value then it should be set to zero', function () {
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var content = scopeContent.content;

        content.setCurrentIndexByOffset(-10);
        $rootScope.$digest();
        var expectedResult = 0;
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(expectedResult);
    });

    it('when trying to set current question by offset to number above the question number then it should be set to last question index', function () {
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var content = scopeContent.content;

        content.setCurrentIndexByOffset(10);
        $rootScope.$digest();
        var expectedResult = 4;
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(expectedResult);
    });

    it('when current slide direction is all then direction-left and direction-right class should be added',
        function () {
            var scopeContent = createDirectiveHtml();
            var content = scopeContent.content;
            var scope = scopeContent.scope;

            scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.ALL.enum);

            expect(content.hasClass('direction-' + ZnkExerciseSlideDirectionEnum.RIGHT.val)).toBeTruthy();
            expect(content.hasClass('direction-' + ZnkExerciseSlideDirectionEnum.LEFT.val)).toBeTruthy();
        }
    );

    it('when current slide direction is none then no direction class should be added', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var scope = scopeContent.scope;

        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.RIGHT.enum);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.LEFT.enum);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.ALL.enum);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.NONE.enum);
        scope.$digest();

        expect(content.hasClass('direction-' + ZnkExerciseSlideDirectionEnum.RIGHT.val)).toBeFalsy();
        expect(content.hasClass('direction-' + ZnkExerciseSlideDirectionEnum.LEFT.val)).toBeFalsy();
    });

    it('given current slide direction is none when trying to set current slide to higher index then it should not be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        var expectCurrIndex = isolateScope.vm.getCurrentIndex();
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.NONE.enum);
        scope.$digest();

        content.setCurrentIndex(4);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(expectCurrIndex);
    });

    it('given current slide direction is none when trying to set current slide to lower index then it should not be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        var expectCurrIndex = isolateScope.vm.getCurrentIndex();
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.NONE.enum);
        scope.$digest();

        content.setCurrentIndex(1);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(expectCurrIndex);
    });

    it('given current slide direction is left when trying to set current slide to higher index then it should be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.LEFT.enum);

        content.setCurrentIndex(4);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(4);
    });


    it('when current slide direction is left then only slide right button should be enabled', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(2);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.LEFT.enum);
        scope.$digest();

        var slideRightElem = content.getSlideRightBtnElement();
        expect(slideRightElem.hasClass('ng-hide')).toBeFalsy();

        var slideLeftElem = content.getSlideLeftBtnElement();
        expect(slideLeftElem.hasClass('ng-hide')).toBeTruthy();
    });

    it('given current slide direction is right when trying to set current slide to lower index then it should be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.RIGHT.enum);

        content.setCurrentIndex(1);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(1);
    });

    it('when current slide direction is right then only slide left button should be enabled', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(2);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.RIGHT.enum);
        scope.$digest();

        var slideRightElem = content.getSlideRightBtnElement();
        expect(slideRightElem.hasClass('ng-hide')).toBeTruthy();

        var slideLeftElem = content.getSlideLeftBtnElement();
        expect(slideLeftElem.hasClass('ng-hide')).toBeFalsy();
    });

    it('given current slide direction is all when trying to set current slide to higher index then it should be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.ALL.enum);

        content.setCurrentIndex(4);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(4);
    });

    it('given current slide direction is ALL when trying to set current slide to lower index then it should be' +
        'set', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        content.setCurrentIndex(3);
        scope.d.actions.setSlideDirection(ZnkExerciseSlideDirectionEnum.ALL.enum);

        content.setCurrentIndex(1);
        var currentIndex = isolateScope.vm.getCurrentIndex();
        expect(currentIndex).toBe(1);
    });

    it('when invoking force done button display with true parameter button then done-btn-show class should be added', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var scope = scopeContent.scope;
        scope.d.actions.forceDoneBtnDisplay(true);
        scope.$digest();
        expect(content.hasClass('done-btn-show')).toBeTruthy();
    });

    it('when invoking force done button display with false parameter button then done-btn-show class should be removed', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var scope = scopeContent.scope;
        scope.d.actions.forceDoneBtnDisplay(false);
        scope.$digest();
        expect(content.hasClass('done-btn-show')).toBeFalsy();
    });

    it('when invoking force done button display with null parameter after it was invoked with false then done-btn-show class should be added', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var scope = scopeContent.scope;
        scope.d.actions.forceDoneBtnDisplay(false);
        scope.$digest();
        scope.d.actions.forceDoneBtnDisplay(null);
        scope.$digest();
        expect(content.hasClass('done-btn-show')).toBeFalsy();
    });

    it('given view mode is not review then done-btn-show class should not be added', function () {
        var scopeSettings = {
            viewMode: ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum
        };
        var content = createDirectiveHtml(undefined, undefined, scopeSettings).content;
        expect(content.hasClass('done-btn-show')).toBeFalsy();
    });

    it('given view mode is review then done-btn-show class should not be added', function () {
        var scopeSettings = {
            viewMode: ZnkExerciseViewModeEnum.REVIEW.enum
        };
        var scopeContent = createDirectiveHtml(undefined, undefined, scopeSettings);
        scopeContent.scope.$digest();
        expect(scopeContent.content.hasClass('done-btn-show')).toBeFalsy();
    });

    it('given view mode is review and initForceDoneBtnDisplay is true then done-btn-show class should be added', function () {
        var scopeSettings = {
            viewMode: ZnkExerciseViewModeEnum.REVIEW.enum,
            initForceDoneBtnDisplay: true
        };
        var content = createDirectiveHtml(undefined, undefined, scopeSettings).content;

        expect(content.hasClass('done-btn-show')).toBeTruthy();
    });

    it('when question and relevant answer are dynamically added then questions number changed event should be broadcast', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;

        var currQuestionsNum = scope.d.questions.length;
        spyOn(isolateScope, '$broadcast');
        scope.d.answers.push({});
        scope.d.answers = angular.copy(scope.d.answers);
        scope.d.questions.push({});
        scope.$digest();
        expect(isolateScope.$broadcast).toHaveBeenCalledWith(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, currQuestionsNum + 1, currQuestionsNum);
    });

    it('when current question is unanswered then right arrow button (next question) ' +
        'should not have question-answered class', function () {

        var scopeContent = createDirectiveHtml(undefined, undefined, undefined, [{}, {}, {}, {}, {}]);
        var content = scopeContent.content;
        var scope = scopeContent.scope;

        var nextBtnContainerElement = content.getSlideRightBtnElement();
        expect(nextBtnContainerElement.hasClass('question-answered')).toBeFalsy();
    });

    it('when current question is answered then right arrow button (next question) ' +
        'should have question-answered class', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;

        var nextBtnContainerElement = content.getSlideRightBtnElement();
        expect(nextBtnContainerElement.hasClass('question-answered')).toBeTruthy();
    });

    it('when current question is answered and view mode is review then right arrow button (next question) ' +
        'should not have question-answered class', function () {
        var settings = {
            viewMode: ZnkExerciseViewModeEnum.REVIEW.enum
        };
        var scopeContent = createDirectiveHtml(undefined, undefined, settings);
        var content = scopeContent.content;

        var nextBtnContainerElement = content.getSlideRightBtnElement();
        expect(nextBtnContainerElement.hasClass('question-answered')).toBeFalsy();
    });

    it('when question numbers change then total question number in znkExerciseBtnSectionDrv ' +
        'directive should be update', function () {
        var scopeContent = createDirectiveHtml();

        scopeContent.scope.d.questions.push({
            id: 6,
            groupDataType: 1
        });
        scopeContent.scope.d.answers.push({
            questionId: 6
        });
        scopeContent.scope.d.answers = angular.copy(scopeContent.scope.d.answers);
        scopeContent.scope.$digest();

        var btnSectionScope = scopeContent.content.getBtnSectionScope();
        var expectedResult = 5;
        expect(btnSectionScope.vm.maxQuestionIndex).toBe(expectedResult);
    });

    it('when answer is answered after allowed time then it should be marked as answer after allowed time', function(){
        var time = 1;
        Date.now = function () {
            return time;
        };
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var isolateScope = scopeContent.isolateScope;
        //var content = scopeContent.content;
        time += 25000;
        isolateScope.vm.questionAnswered();
        expect(scope.d.answers[0].afterAllowedTime).toBeTruthy();
    });

    it('when bindExerciseViewTo action is invoked then znk exercise view should be binded to viewState which received as parameter',
        function(){
            var scopeContent = createDirectiveHtml();
            var scope = scopeContent.scope;

            var exerciseView = {};
            scope.d.actions.bindExerciseViewTo(exerciseView);

            scope.d.actions.setSlideIndex(2);
            scope.$digest();
            var expectedResult = 2;
            expect(exerciseView.currSlideIndex).toBe(expectedResult);

            exerciseView.currSlideIndex = 1;
            scope.$digest();
            var currSlideIndex = scope.d.actions.getCurrentIndex();
            expectedResult = 1;
            expect(currSlideIndex).toBe(expectedResult);
        }
    );

    it('when unbindExerciseView action is invoked then znk exercise view should be unbinded to viewState which ' +
        'received as parameter', function(){
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;

        var exerciseView = {
            currSlideIndex: 5
        };
        scope.d.actions.bindExerciseViewTo(exerciseView);
        scope.d.actions.unbindExerciseView();

        scope.d.actions.setSlideIndex(2);
        scope.$digest();
        var expectedResult = 5;
        expect(exerciseView.currSlideIndex).toBe(expectedResult);

        exerciseView.currSlideIndex = 4;
        scope.$digest();
        var currSlideIndex = scope.d.actions.getCurrentIndex();
        expectedResult = 2;
        expect(currSlideIndex).toBe(expectedResult);
    });
});
