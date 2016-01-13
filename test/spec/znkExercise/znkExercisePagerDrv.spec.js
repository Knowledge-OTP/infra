describe('testing directive "znkExercisePagerDrv":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.znkExercise', 'htmlTemplates','testUtility'));

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
});
