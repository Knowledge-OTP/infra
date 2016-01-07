xdescribe('testing directive "freeTextAnswerDrv.test":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.toefl', 'htmlTemplates', 'directiveCtrlMockModule'));

    //get dependencies
    var $rootScope, $compile, MockDrvCtrlSrv;
    beforeEach(inject([
        '$rootScope', '$compile', 'MockDrvCtrlSrv', 'MediaSrv',
        function (_$rootScope, _$compile, _MockDrvCtrlSrv, _MediaSrv) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            MockDrvCtrlSrv = _MockDrvCtrlSrv;
            _MediaSrv.soundsEnabled = false;
        }
    ]));

    function createDirectiveHtml(scope, content) {
        if (!scope) {
            scope = $rootScope.$new();
            scope.d = {};
            scope.d.question = {
                order: 4,
                content: 'what is the right answer?',
                answerTypeId: 1,
                correctAnswerId: 2,
                correctAnswerText: [
                    {content: '4', id: 1},
                    {content: '4.0', id: 2}
                ]
            };
        }

        if (!content) {
            content = angular.element('<div question-drv question="d.question" ng-model="d.answer"></div>');
        }


        MockDrvCtrlSrv.mock(content,'questionsHeightControlDrv');
        MockDrvCtrlSrv.mock(content,'znkExerciseDrv');

        var contentDomElement = content[0];
        $compile(content)(scope);

        content.getQuestionNoteTitle = function(){
          return contentDomElement.querySelector('.note-title').innerHTML;
        };

        content.getQuestionNoteTitle = function(){
            return contentDomElement.querySelector('.note-content').innerHTML;
        };

        content.setInputText = function(value){
            var $answerGridElem = angular.element(contentDomElement.querySelector('[ng-model]'));
            var ngModelCtrl = $answerGridElem.data().$ngModelController;
            var gridScope = $answerGridElem.isolateScope();
            ngModelCtrl.$setViewValue(value);
            gridScope.submitClick();
            scope.$apply();
        };

        content.getFreeAnswerElement = function(){
          return angular.element(contentDomElement.querySelector('[free-text-answer-drv]'));
        };

        content.getTextBox = function(){
            return angular.element(contentDomElement.querySelector('free-text-answer-grid'));
        };

        scope.$digest();

        return {
            scope: scope,
            content: content
        };
    }

    it('when question type is 1(free text) then free text answer directive should be generated and correct and wrong classes should not be added',function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        expect(content[0].querySelectorAll('[free-text-answer-drv]').length).toBe(1);
        var $freeTextAnswerDrv = content.getFreeAnswerElement();
        expect($freeTextAnswerDrv.hasClass('wrong')).toBe(false);
        expect($freeTextAnswerDrv.hasClass('correct')).toBe(false);
    });

    it('when entering an answer to input field then once blur occur the model value should be updated accordingly',function(){
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        var INPUT_VALUE = '0/5';
        content.setInputText(INPUT_VALUE);
        expect(scope.d.answer).toBe(INPUT_VALUE);
    });

    it('when entering a wrong answer to input field then once blur occur the wrong class should be added',function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var INPUT_VALUE = '45';
        content.setInputText(INPUT_VALUE);
        var $freeTextAnswerDrv = content.getFreeAnswerElement();
        expect($freeTextAnswerDrv.hasClass('wrong')).toBe(true);
    });

    it('when entering a correct answer to input field then once blur occur the correct class should be added',function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var INPUT_VALUE = '4';
        content.setInputText(INPUT_VALUE);
        var $freeTextAnswerDrv = content.getFreeAnswerElement();
        expect($freeTextAnswerDrv.hasClass('correct')).toBe(true);
    });

    it('given entered answer then input field should be disabled',function(){
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content;
        var INPUT_VALUE = '4';
        content.setInputText(INPUT_VALUE);
        var $input = content.getTextBox();
        expect($input.attr('disabled')).toBe('disabled');
    });

    it('when model is set to correct answer then the input should be set and correct class should be added',function(){
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        scope.d.answer = '4';
        scope.$digest();
        var $input = content.getTextBox();
        expect($input.attr('disabled')).toBe('disabled');
        var $freeTextAnswerDrv = content.getFreeAnswerElement();
        expect($freeTextAnswerDrv.hasClass('correct')).toBe(true);
    });

    it('when model is set to wrong answer then the input should be set and wrong class should be added',function(){
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        scope.d.answer = '37';
        scope.$digest();
        var $input = content.getTextBox();
        expect($input.attr('disabled')).toBe('disabled');
        var $freeTextAnswerDrv = content.getFreeAnswerElement();
        expect($freeTextAnswerDrv.hasClass('wrong')).toBe(true);
    });
});
