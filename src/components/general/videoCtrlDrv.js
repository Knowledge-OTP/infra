/**
 * attrs -
 *      videoNotAvail:
 *         the message to display when video is not available
 *         example : video-not-avail="<div class=&quot;video_not_available&quot; ></div>">
 *      vidPoster:
 *         the poster for the video.  we dynamically check it . that is why we don't use the
 *         default poster attribute
 *      defaultPoster:
 *          the default poster to display when poster is unavailable or is empty
 *      ng-src
 *          the source for the vid
 *          example : $scope.videoUrl = $sce.trustAsResourceUrl(
 'http://d1qqqwawt7o27r.cloudfront.net/videos/questions/1768.mp4');
 */
'use strict';
angular.module('znk.infra.general')
       .directive('videoCtrlDrv', [function () {
           return {
               link: function (scope, element, attrs) {
                   var vidElm = element[0];
                   var vidNotAvail = (angular.isDefined(attrs.videoNotAvail)) ?
                       attrs.videoNotAvail : '<div class=\'video_not_available\'></div>';
                   var setPoster = function (videoTag) {
                       videoTag.poster =
                           (angular.isDefined(attrs.defaultPoster)) ? attrs.defaultPoster :
                               'http://corrupt-system.de/assets/media/sintel/sintel-trailer.jpg';
                   };
                   var setVid = function (elmCur, vidNotAvail) {
                       elmCur.replaceWith(vidNotAvail);
                   };
                   if (angular.isUndefined(attrs.vidPoster) || attrs.vidPoster === '') {
                       setPoster(vidElm);
                   }
                   else {
                       var image = new Image();
                       image.src = attrs.vidPoster;
                       image.onerror = function () {
                           setPoster(vidElm);
                       };
                   }
                   if (angular.isUndefined(attrs.ngSrc) || attrs.ngSrc === '') {
                       setVid(element, vidNotAvail);
                   }
                   else {
                       vidElm.addEventListener('error', function () {
                           setVid(element, vidNotAvail);
                       });
                       vidElm.addEventListener('loadeddata', function () {
                           this.style.visibility = 'visible';
                       });
                   }
               }
           };
       }]);
