/**
 * attrs -
 *      videoNotAvail:
 *         the message to display when video is not available
 *      defaultPoster:
 *          the default poster to display when poster is unavailable or is empty
 */
'use strict';
angular.module('znk.infra.general')
       .directive('videoCtrlDrv', [function () {
           return {
               link: function (scope, element, attrs) {
                   var vidElm = element[0];
                   var sources = vidElm.querySelectorAll('source');
                   var vidNotAvail = (angular.isDefined(attrs.videoNotAvail)) ?
                       attrs.videoNotAvail : '<div class="video_not_available" ></div>';
                   var setVid = function (videoTag) {
                       videoTag.poster =
                           (angular.isDefined(attrs.defaultPoster)) ? attrs.defaultPoster :
                               'http://corrupt-system.de/assets/media/sintel/sintel-trailer.jpg';
                   };
                   if (angular.isUndefined(attrs.poster) || attrs.poster === '') {
                       setVid(vidElm);
                   }
                   else {
                       var image = new Image();
                       image.src = attrs.poster;
                       image.onerror = function () {
                           setVid(vidElm);
                       };
                   }
                   if (sources.length !== 0) {
                       var lastSource = sources[sources.length - 1];
                       lastSource.addEventListener('error', function () {
                           element.replaceWith(vidNotAvail);
                       });
                       vidElm.addEventListener('loadeddata', function () {
                           this.style.visibility = 'visible';
                       });
                   }
               }
           };
       }]);
