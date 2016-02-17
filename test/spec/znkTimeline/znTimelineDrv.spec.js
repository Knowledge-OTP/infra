describe('testing directive "znkTimeline":', function () {
    'use strict';

    // Load  the module, which contains the directive
    beforeEach(module('znk.infra.znkTimeline', 'htmlTemplates'));

    //get dependencies
    var $rootScope, $compile, TimelineSrv;
    beforeEach(inject([
        '$rootScope', '$compile', 'TimelineSrv',
        function (_$rootScope, _$compile, _TimelineSrv) {
            $rootScope = _$rootScope;
            $compile = _$compile;
            TimelineSrv = _TimelineSrv;
        }
    ]));

    function createDirectiveHtml($scope, content, onFinishCb) {
        if (!$scope) {

            $scope = $rootScope.$new();
            $scope.currentSubjectId = 2;

            $scope.timeLineData = {
                data:[
                    { exerciseId: 1105,
                        exerciseType: 4,
                        score: 90,
                        time: 1444503875221
                    },
                    { exerciseId: 1105,
                        exerciseType: 1,
                        score: 190,
                        time: 1444503875221
                    },
                    { exerciseId: 1105,
                        exerciseType: 4,
                        score: 20,
                        time: 1444503875221
                    },
                    { exerciseId: 1105,
                        exerciseType: 3,
                        score: 10,
                        time: 1444503875221
                    }
                ],
                id:  $scope.currentSubjectId
            };


            for(var i=0 ;i <4; i ++){
                $scope.timeLineData.data[4+i] = $scope.timeLineData.data[i];
                $scope.timeLineData.data[8+i] = $scope.timeLineData.data[i];
                $scope.timeLineData.data[12+i] = $scope.timeLineData.data[i];
            }

            var optionsPerDevice = {
                height: 150,
                distance: 90,
                upOrDown: 75,
                yUp: 65,
                yDown: 75
            };

            $scope.options = {
                colors: ['#75cbe8', '#f9d41b', '#ff5895', '', '','#AF89D2', '#51CDBA'],
                colorId: $scope.currentSubjectId,
                isMobile: false,
                height: optionsPerDevice.height,
                type: 'multi',
                isMax: true,
                max: 29,
                min: 0,
                subPoint: 35,
                distance: optionsPerDevice.distance,
                lineWidth: 2,
                images: TimelineSrv.getImages(),
                numbers: {
                    font: '200 12px Lato',
                    fillStyle: '#4a4a4a'
                },
                onFinish: onFinishCb
            }
        }

        if (!content) {
            content = '<canvas znk-timeline timeline-data="timeLineData" timeline-settings="options"></canvas>'
        }

        content = $compile(content)($scope);
        $scope.$digest();

        return {
            scope: $scope,
            content: content
        };
    }

    it('should have retina support (width and height * 2 from the style width and height)', function () {
        var scopeContent = createDirectiveHtml();
        var content = scopeContent.content[0];
        expect(content.width).toBeDefined();
        expect(content.height).toEqual(300);
        expect(content.style.width).toBeDefined();
        expect(content.style.height).toEqual('150px');
    });

    it('should fire onFinish if passed to options and return data for user to use', function () {
        function onFinishCb(data) {
            expect(data.canvasElem).toBeDefined();
            expect(data.ctx).toBeDefined();
            expect(data.data.biggestScore).toBeDefined();
            expect(data.data.lastLine).toEqual(jasmine.any(Array));
        }
        createDirectiveHtml(null, null, onFinishCb);
    });

});
