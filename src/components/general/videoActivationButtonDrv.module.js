'use strict';
angular.module('znk.infra.general')
       .directive('videoActivationButtonDrv',
           ['$window', '$http', '$log', function ($window, $http, $log) {
               return {
                   restrict: 'E', scope: {
                       playVideo: '&ngClick'
                   }, link: function (scope, element, attrs) {
                       var elmCur = element[0].children[0];
                       elmCur.poster =
                           'http://corrupt-system.de/assets/media/sintel/sintel-trailer.jpg';
                       scope.disabledButton = true;
                       scope.analyticsLabel = '';
                       scope.isLoading = true;
                       scope.isAvail = true;
                       scope.pathFull =
                           (angular.isDefined(attrs.vidLib) && attrs.vidLib !== '') ?
                               attrs.vidLib : 'http://d1qqqwawt7o27r.cloudfront.net/';
                       function videoIsMissing() {
                           scope.label = 'Video is not available';
                           // the assignment to scope.label happend too late and the ui is not
                           attrs.$set('label', 'Video is not available');
                           scope.isLoading = false;
                           scope.isAvail = false;
                       }
                       function isPluginsValid() {
                           if (!$window.cordova) {  //  PC
                               return true;
                           }
                           return !!$window.plugins && $window.plugins.streamingMedia;
                       }
                       function getVideoUrl() {
                           var result;
                           var urlTypePart = '';
                           //  read videos end-point
                           var videosEndPoint = scope.pathFull;
                           if (videosEndPoint.lastIndexOf('/', videosEndPoint.length - 1) !==
                               videosEndPoint.length - 1) {
                               videosEndPoint += '/';
                           }
                           switch (attrs.videoType) {
                               case 'tutorials':   // EnumSrv.exerciseType.tutorial.enum:
                                   urlTypePart = 'tutorials';
                                   scope.label = 'Video Tutorial';
                                   break;
                               default:       // question isn't part of EnumSrv.exerciseType...
                                   urlTypePart = 'questions';
                                   scope.label = 'Video Solution';
                                   break;
                           }
                           if (urlTypePart !== '') {
                               //  set full video url
                               result =
                                   videosEndPoint + 'videos/' + urlTypePart + '/' +
                                   attrs.contentId +
                                   '.mp4';
                               scope.analyticsLabel = urlTypePart + '-' + attrs.contentId;
                           }
                           return result;
                       }
                       if (isPluginsValid()) {
                           var videoUrl = getVideoUrl();
                           if (angular.isDefined(videoUrl)) {
                               $http({
                                   method: 'HEAD', url: videoUrl //  append videos end-point to the
                                                                 // url to get the full url
                               })
                               //  in case something needs to be checked in the callbacks, add
                               //  "response" parameter to each callback
                               .then(function successCallback() {
                                   scope.disabledButton = false;
                                   scope.isLoading = false;
                                   scope.isAvail = true;
                                   elmCur.src = videoUrl;
                               }, function errorCallback(err) {
                                   scope.disabledButton = true;
                                   videoIsMissing();
                                   $log.error(err);
                               });
                           }
                       } else {
                           // PC Only
                           videoIsMissing();
                       }
                   }, templateUrl: function (elem, attrs) {
                       return attrs.templateUrl;
                   }
               };
           }]);
