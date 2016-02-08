describe('testing directive "selectAnswerDrv":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.znkExercise', 'htmlTemplates', 'testUtility'));

    var answerIndexFormatter = function(){

    };
    beforeEach(module(function(ZnkExerciseAnswersSrvProvider){
        ZnkExerciseAnswersSrvProvider.config.selectAnswer.setAnswerIndexFormatter(function(){
            return answerIndexFormatter.apply(this,arguments);
        });
    }));
    //get dependencies
    var $rootScope, $compile, $timeout, MockDrvCtrlSrv;
    beforeEach(inject([
        '$rootScope', '$compile', '$timeout', 'MockDrvCtrlSrv',
        function (_$rootScope, _$compile, _$timeout, _MockDrvCtrlSrv) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            $timeout = _$timeout;
            MockDrvCtrlSrv = _MockDrvCtrlSrv;
        }
    ]));

    function createDirectiveHtml($scope) {
        if (!$scope) {
            $scope = $rootScope.$new();
            $scope.d = {};
            $scope.d.question = {
                order: 4,
                content: 'what is the right answer?',
                answers: [{id: 1, content: 'answer 1'},{id: 2, content: 'answer 2'},{id: 3, content: 'answer 3'},{id: 4, content: 'answer 4'}],
                answerTypeId: 0,
                correctAnswerId: 2
            };
        }

        var content = angular.element('<select-answer ng-model="d.selectedAnswer"></select-answer>');
        var contentDomElement = content[0];

        MockDrvCtrlSrv.mock(content,'answerBuilder');


        $compile(content)($scope);

        content.getQuestionNum = function(){
            return +(content[0].querySelector('.num').innerHTML);
        };

        content.getQuestion = function(){
            return content[0].querySelector('.question').innerHTML.trim();
        };

        content.getAnswersDrvType = function(){
            return content[0].querySelector('[answers-builder-drv]').getAttribute('type');
        };

        content.getAnswerIndex = function(index){
            return content[0].querySelectorAll('.index-char')[index].innerHTML;
        };

        content.getAnswerContent = function(index){
            return content[0].querySelectorAll('.answers-wrapper .content')[index].innerHTML.trim();
        };

        content.tapOnAnswer = function(index){
            var $tapableElement = contentDomElement.querySelectorAll('.answer[ng-click]')[index];
            $tapableElement.click();
        };

        content.getAnswer = function(index){
            var $selectAnswerDrv = contentDomElement.querySelectorAll('.answer');
            return angular.element(index !== undefined ? $selectAnswerDrv[index] : $selectAnswerDrv);
        };

        $scope.$digest();

        return {
            scope: $scope,
            content: content,
            isolateScope: content.isolateScope()
        };
    }

    it('given array of answers then the view of each answer view should contain the alphabetic representation of the ' +
        'answer number as well as the answer content', function () {
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var content = scopeContent.content;

        for(var i in isolateScope.d.answers){
            var UPPER_A_ASCII_CODE = 65;
            var expectedResult = String.fromCharCode(UPPER_A_ASCII_CODE + (+i));
            expect(content.getAnswerIndex(i)).toBe(expectedResult);
        }
    });

    it('when answer index formatter is set them answer index should set according to formatter',function(){
        answerIndexFormatter = function(answerIndex){
          return answerIndex;
        };
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var content = scopeContent.content;

        for(var i in isolateScope.d.answers){
            var expectedResult = i;
            expect(content.getAnswerIndex(i)).toBe(expectedResult);
        }
    });

    it('given question of type 0 when clicking on the wrong answer then the wrong answer should have the wrong class ' +
    'and the correct answer should have the answered-incorrect class other answers should have the "neutral" class', function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var TAPPED_ANSWER_INDEX = 2;
        var CORRECT_ANSWER_INDEX = 0;
        content.tapOnAnswer(TAPPED_ANSWER_INDEX);
        var $tappedAnswer = content.getAnswer(TAPPED_ANSWER_INDEX);
        var $correctAnswer = content.getAnswer(CORRECT_ANSWER_INDEX);
        expect($tappedAnswer.hasClass('wrong')).toBe(true);
        expect($correctAnswer.hasClass('answered-incorrect')).toBe(true);
    });

    it('when answer is selected then other answered cannot be selected',function(){
        var scopeContent = createDirectiveHtml();
        var isolateScope = scopeContent.isolateScope;
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        var TAPPED_ANSWER_INDEX = 2;
        var CORRECT_ANSWER_INDEX = 0;
        content.tapOnAnswer(TAPPED_ANSWER_INDEX);
        scope.$digest();
        content.tapOnAnswer(CORRECT_ANSWER_INDEX);
        var correctAnswerElem = content.getAnswer(CORRECT_ANSWER_INDEX);
        expect(correctAnswerElem.hasClass('answered-incorrect')).toBe(true);
    });

    it('when model is set then the answers should have relevant classes',function(){
        var scope = $rootScope.$new();
        scope.d = {
            selectedAnswer: 2
        };
        var scopeContent = createDirectiveHtml(scope);
        var content = scopeContent.content;
        $timeout.flush();
        //selected answer id is 1 , this question is located in index 0
        expect(content.getAnswer(0).hasClass('answered-incorrect')).toBe(true);
        expect(content.getAnswer(1).hasClass('wrong')).toBe(true);
        expect(content.getAnswer(2).hasClass('neutral')).toBe(true);
    });
});
