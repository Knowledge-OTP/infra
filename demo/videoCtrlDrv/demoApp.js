(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.general'])
           .controller('videoCtrl', ['$scope', '$sce', function ($scope, $sce) {
               $scope.vidNotAvail = '<div class=\'video_not_available\' ></div>';
               $scope.poster ='http://corrupt-system.de/assets/media/sintel/sintel-trailer.jp';
               $scope.defaultPoster='http://corrupt-system.de/assets/media/sintel/sintel-trailer.jpg';
               $scope.videoUrl = $sce.trustAsResourceUrl(
                   'http://d1qqqwawt7o27r.cloudfront.net/videos/questions/1768.mp4');
               $scope.videoErrorHandler = function(ev){
                 alert('video not exits');
               };
           }]);

})(angular);
