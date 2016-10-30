(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.znkTimeline'])
        .controller('Main', function ($scope) {

           $scope.currentSubjectId = 2;

            $scope.timeLineData = {
                data:[
                    { exerciseId: 1105,
                        exerciseType: 4,
                        score: 90,
                        time: 1444503875221,
                        iconKey: false
                    },
                    { exerciseId: 1105,
                        exerciseType: 1,
                        score: 190,
                        time: 1444503875221,
                        iconKey: 'tutorial'
                    },
                    { exerciseId: 1105,
                        exerciseType: 4,
                        score: 20,
                        time: 1444503875221,
                        iconKey: 'section'
                    },
                    { exerciseId: 1105,
                        exerciseType: 3,
                        score: 10,
                        time: 1444503875221,
                        iconKey: 'game'
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
                numbers: {
                    font: '200 12px Lato',
                    fillStyle: '#4a4a4a'
                },
                onFinish: function (obj) {
                    console.log('onFinish', obj);
                }
            }
        });
})(angular);
