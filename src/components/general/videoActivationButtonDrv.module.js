angular.module('actWebApp')
       .directive('videoActivationButtonDrv',
           ['$window', '$http', '$log', function ($window, $http, $log) {   //  TODO:  add this , 'NetworkSrv' , 'PopUpSrv' , 'ErrorHandlerSrv'
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
                       scope.pathFull = 'http://d1qqqwawt7o27r.cloudfront.net/';
                       function videoIsMissing() {
                           scope.label = 'Video is not available';
                           // the assignment to scope.label happend too late and the ui is not
                           attrs.$set('label', 'Video is not available');
                           scope.isLoading = false;
                           scope.isAvail = false;
                       }

                       //  validates the plugin
                       function isPluginsValid() {
                           if (!$window.cordova) {  //  PC
                               return true;
                           }
                           return !!$window.plugins && $window.plugins.streamingMedia;
                       }

                       function getVideoUrl() {
                           var result = undefined;
                           var urlTypePart = '';
                           //  read videos end-point
                           //  @todo: replace to real url from env object
                           var videosEndPoint = scope.pathFull;
                           if (videosEndPoint.lastIndexOf('/', videosEndPoint.length - 1) !==
                               videosEndPoint.length - 1) {
                               videosEndPoint += '/';
                           }
                           switch (attrs.videoType) {
                               //  TODO: work with EnumSrv values
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

                           //  verify that the videoUrl has value
                           if (angular.isDefined(videoUrl)) {
                               // check if video url exits by sending HEAD request
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
