describe('testing directive "znkExercisePagerDrv":', function () {
    'use strict';

    var setAnswersFormatValidtors;    
    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.znkExercise', 'htmlTemplates', 'testUtility', function (QuestionTypesSrvProvider) {
        setAnswersFormatValidtors = QuestionTypesSrvProvider.setAnswersFormatValidtors;
    }));

    //get dependencies
    var $rootScope, $compile, $timeout, MockDrvCtrlSrv, ZnkExerciseEvents;
    beforeEach(inject([
        '$rootScope', '$compile', '$timeout', 'MockDrvCtrlSrv', 'ZnkExerciseEvents',
        function (_$rootScope, _$compile, _$timeout, _MockDrvCtrlSrv, _ZnkExerciseEvents) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            $timeout = _$timeout;
            MockDrvCtrlSrv = _MockDrvCtrlSrv;
            ZnkExerciseEvents = _ZnkExerciseEvents;
        }
    ]));

    var actions = {};    
    var znkExerciseDrvCtrl;
    function createDirectiveHtml($scope, content) {
        if (!$scope) {
            $scope = $rootScope.$new();
            $scope.d = {
                currentSlider: 0,
                questions:[{
                    id: 1,
                    __questionStatus: {
                        bookmark: true,
                        userAnswer: 2
                    }
                },{
                    id: 2,
                    __questionStatus: {
                        bookmark: true,
                        index: 1,
                        isAnsweredCorrectly: true,
                        userAnswer: 2
                    },
                    answerTypeId: 7
                },{
                    id: 3,
                    __questionStatus: {
                        bookmark: true,
                        userAnswer: 2
                    }
                },{
                    id: 4,
                    __questionStatus: {
                        bookmark: true,
                        userAnswer: 2
                    }
                }]
            };
        }

        if (!content) {
            content = '<znk-exercise-pager ng-model="d.currentSlider" questions="d.questions"></znk-exercise-pager>';
        }

        content = angular.element(content);
        angular.element(document.body).append(content);

        znkExerciseDrvCtrl = MockDrvCtrlSrv.mock(content,'znkExercise');

        $compile(content)($scope);
        var contentDomElement = content[0];

        content.getAllPagerItemsWithCurrentClass = function(){
            return angular.element(contentDomElement.querySelectorAll('.pager-item.current'));
        };

        content.tapOnItem = function(index){
            var pagerItemElement = angular.element(contentDomElement.querySelectorAll('.pager-item')[index]);
            var scope = pagerItemElement.scope();
            scope.d.tap(index);
            $timeout.flush();
        };

        actions.getPagerItem = function (index) {
            return angular.element(content.find('.pager-item')[index]);
        };

        $scope.$digest();

        return {
            scope: $scope,
            content: content
        };
    }

    it('when current slider is "0" then the pager item 0 should be the only one who has the "current" class ', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        $timeout.flush();
        var itemsWithCurrentClass = content.getAllPagerItemsWithCurrentClass();
        expect(itemsWithCurrentClass.length).toBe(1);
        expect(scope.d.questions[0].id).toBe(itemsWithCurrentClass.scope().question.id);
    });

    it('when current slider is "3" then the pager item 3 should be the only one who has the "current" class ', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        //$timeout.flush();
        scope.d.currentSlider = 3;
        scope.$digest();
        $timeout.flush();
        var itemsWithCurrentClass = content.getAllPagerItemsWithCurrentClass();
        expect(itemsWithCurrentClass.length).toBe(1);
        expect(scope.d.questions[3].id).toBe(itemsWithCurrentClass.scope().question.id);
    });

    it('when tapping on pager item 3 then the setCurrentIndex in znkExerciseDrv controller should be invoked', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;

        spyOn(znkExerciseDrvCtrl,'setCurrentIndex');
        content.tapOnItem(3);
        scope.$digest();
        expect(znkExerciseDrvCtrl.setCurrentIndex).toHaveBeenCalledWith(3);
    });

    it('when on question answered callback invoke, then should be check if answer valid against' + 
        'valid format to evalute if needs to change pager item should be invoked, one formmater' +
        'function that returns true so should have correct class', function () {
        setAnswersFormatValidtors({
            7: [
                function ($log) {
                    return function(userAnswer) {
                         return userAnswer === 2; // a function that returns true for valid answer
                    }
                }
            ]
        });    
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;

        $rootScope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, scope.d.questions[1]);

        var secondPagerItemCorrect = actions.getPagerItem(1).hasClass('correct');            
        expect(secondPagerItemCorrect).toBeTruthy();    
    });
    
    it('when on question answered callback invoke, then should be check if answer valid against' + 
        'valid format to evalute if needs to change pager item should be invoked, one formmater' +
        'function that returns false so should not have correct class', function () {
        setAnswersFormatValidtors({
            7: [
                function ($log) {
                    return function(userAnswer) {
                        return userAnswer > 9; // a function that returns false for valid answer
                    }
                }
            ]
        });   
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;

        $rootScope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, scope.d.questions[1]);

        var secondPagerItemCorrect = actions.getPagerItem(1).hasClass('correct');            
        expect(secondPagerItemCorrect).toBeFalsy();    
    });
    
    it('when on question answered callback invoke, then should be check if answer valid against' + 
        'valid format to evalute if needs to change pager item should be invoked, one formmater' +
        'function that returns false and second formmater that return true so should have correct class', function () {
        setAnswersFormatValidtors({
            7: [
                function ($log) {
                    return function(userAnswer) {
                        return userAnswer === 0; // a function that returns false for valid answer
                    }
                },
                /\d/g // a regex that returns true
            ]
        });    
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;

        $rootScope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, scope.d.questions[1]);

        var secondPagerItemCorrect = actions.getPagerItem(1).hasClass('correct');            
        expect(secondPagerItemCorrect).toBeTruthy();    
   });
    
    it('when on question answered callback invoke, then should be check if answer valid against' + 
        'valid format to evalute if needs to change pager item should be invoked, one formmater' +
        'function that returns false and a second formmater that returns false so should not have correct class', function () {
        setAnswersFormatValidtors({
            7: [
                function ($log) {
                    return function(userAnswer) {
                       return userAnswer > 9; // a function that returns false for valid answer
                    }
                },
                 /\D/g // a regex that returns false
            ]
        });   
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;

        $rootScope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, scope.d.questions[1]);

        var secondPagerItemCorrect = actions.getPagerItem(1).hasClass('correct');            
        expect(secondPagerItemCorrect).toBeFalsy();    
    });
});
