xdescribe('testing directive "znkExercisePagerDrv":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.toefl', 'htmlTemplates','directiveCtrlMockModule'));

    //get dependencies
    var $rootScope, $compile, $timeout, MockDrvCtrlSrv;
    beforeEach(inject([
        '$rootScope', '$compile', '$timeout', 'MockDrvCtrlSrv',
        function (_$rootScope, _$compile, _$timeout, _MockDrvCtrlSrv) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            $timeout = _$timeout;
            MockDrvCtrlSrv =_MockDrvCtrlSrv;
        }
    ]));

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
                        userAnswer: 2
                    }
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
            var content = '<znk-exercise-pager ng-model="vm.currentSlider" questions="d.questions"></znk-exercise-pager>';
        }

        content = angular.element(content);
        angular.element('body').append(content);

        MockDrvCtrlSrv.mock(content,'znkExercise');

        $compile(content)($scope);
        var contentDomElement = content[0];

        content.getAllPagerItemsWithCurrentClass = function(){
            return angular.element(contentDomElement.querySelectorAll('.pager-item.current'));
        };

        content.tapOnItem = function(index){
            var pagerItemDomElement = contentDomElement.querySelectorAll('.pager-item')[index];
            ionic.EventController.trigger('tap', {target: pagerItemDomElement}, true);
            $timeout.flush();
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
        scope.vm.currentSlider = 3;
        scope.$digest();
        $timeout.flush();
        var itemsWithCurrentClass = content.getAllPagerItemsWithCurrentClass();
        expect(itemsWithCurrentClass.length).toBe(1);
        expect(scope.d.questions[3].id).toBe(itemsWithCurrentClass.scope().question.id);
    });

    it('when tapping on pager item 3 then the model value should be 3 and pager item 3 should have the current class', function () {
        var scopeContent = createDirectiveHtml();
        var scope = scopeContent.scope;
        var content = scopeContent.content;
        //$timeout.flush();
        content.tapOnItem(3);
        scope.$digest();
        //$timeout.flush();
        expect(scope.vm.currentSlider).toBe(3);
        var itemsWithCurrentClass = content.getAllPagerItemsWithCurrentClass();
        expect(itemsWithCurrentClass.length).toBe(1);
        expect(scope.d.questions[3].id).toBe(itemsWithCurrentClass.scope().question.id);
    });
});
