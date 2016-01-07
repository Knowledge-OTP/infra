xdescribe('testing directive "selectAnswerDrv":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.toefl', 'htmlTemplates', 'directiveCtrlMockModule'));

    //get dependencies
    var $rootScope, $compile, $timeout, MockDrvCtrlSrv;
    beforeEach(inject([
        '$rootScope', '$compile', '$timeout', 'MockDrvCtrlSrv', 'MediaSrv',
        function (_$rootScope, _$compile, _$timeout, _MockDrvCtrlSrv, _MediaSrv) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            $timeout = _$timeout;
            MockDrvCtrlSrv = _MockDrvCtrlSrv;
            _MediaSrv.soundsEnabled = false;
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

        var content = angular.element('<div question-drv question="d.question" ng-model="d.selectedAnswer"></div>');
        var contentDomElement = content[0];

        MockDrvCtrlSrv.mock(content,'questionsHeightControlDrv');
        MockDrvCtrlSrv.mock(content,'znkExerciseDrv');

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
            return content[0].querySelectorAll('.answers-wrapper .answer-index')[index].innerHTML;
        };

        content.getAnswerContent = function(index){
            return content[0].querySelectorAll('.answers-wrapper .content')[index].innerHTML.trim();
        };

        content.tapOnAnswer = function(index){
            var $tapableElement = contentDomElement.querySelectorAll('.answers-wrapper .answer[ng-click]')[index];
            $tapableElement.click();
        };

        content.getAnswer = function(index){
            var $selectAnswerDrv = contentDomElement.querySelectorAll('.answer');
            return angular.element(index !== undefined ? $selectAnswerDrv[index] : $selectAnswerDrv);
        };

        $scope.$digest();

        return {
            scope: $scope,
            content: content
        };
    }

    it('given question type 0(select-answer-drv) then the generated answer directive should be select-answer-drv', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        expect(content[0].querySelectorAll('[select-answer-drv]').length).toBe(1);
    });

    it('given array of answers then the view of each answer view should contain the alphabetic representation of the answer number as well as the answer content', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;

        for(var i in scope.d.question.answers){
            var answer = scope.d.question.answers[i];

            expect(String.fromCharCode(96+answer.id)).toBe(content.getAnswerIndex(i));
            expect(answer.content.trim()).toBe(content.getAnswerContent(i));
        }
    });

    it('given question of type 0 when clicking on the wrong answer then the wrong answer should have the wrong class ' +
    'and the correct answer should have the answered-incorrect class other answers should have the "neutral" class', function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var TAPPED_ANSWER = 2;
        var CORRECT_ANSWER = 1;
        content.tapOnAnswer(TAPPED_ANSWER);
        var $tappedAnswer = content.getAnswer(TAPPED_ANSWER);
        var $correctAnswer = content.getAnswer(CORRECT_ANSWER);
        expect($tappedAnswer.hasClass('wrong')).toBe(true);
        expect($correctAnswer.hasClass('answered-incorrect')).toBe(true);
    });

    it('when answer is selected then other answered cannot be selected',function(){
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        var TAPPED_ANSWER = 2;
        content.tapOnAnswer(TAPPED_ANSWER);
        scope.$digest();
        for(var i in scope.d.question.answers){
            if(+i !== TAPPED_ANSWER){
                var $answer = content.getAnswer(+i);
                content.tapOnAnswer(+i);
                expect($answer.hasClass('wrong')).toBe(false);
            }
        }
    });

    it('when model is set then the answers should have relevant classes',function(){
        var scope = $rootScope.$new();
        scope.d = {
            selectedAnswer: 1
        };
        scope.d.question = {
            order: 4,
            content: 'what is the right answer?',
            answers: [{id: 1, content: 'answer 1'},{id: 2, content: 'answer 2'},{id: 3, content: 'answer 3'},{id: 4, content: 'answer 4'}],
            answerTypeId: 0,
            correctAnswerId: 2
        };
        var scopeContent = createDirectiveHtml(scope);
        var content = scopeContent.content;
        $timeout.flush();
        //selected answer id is 1 , this question is located in index 0
        expect(content.getAnswer(0).hasClass('wrong')).toBe(true);
        expect(content.getAnswer(1).hasClass('answered-incorrect')).toBe(true);
        expect(content.getAnswer(2).hasClass('neutral')).toBe(true);
        expect(content.getAnswer(3).hasClass('neutral')).toBe(true);
    });
});
