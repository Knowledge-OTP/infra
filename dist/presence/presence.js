(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', [])
        .run([
            'PresenceService',
            function (PresenceService) {
                PresenceService.addListeners();
            }
        ]);
})(angular);

/*! Idle.Js, copyright 2015-01-01, Shawn Mclean*/
(function(){var a;document.addEventListener||(document.addEventListener=document.attachEvent?function(a,b,c){return document.attachEvent("on"+a,b,c)}:function(){return{}}),document.removeEventListener||(document.removeEventListener=document.detachEvent?function(a,b){return document.detachEvent("on"+a,b)}:function(){return{}}),a={},a=function(){function a(a){var b,c;a&&(this.awayTimeout=parseInt(a.awayTimeout,10),this.onAway=a.onAway,this.onAwayBack=a.onAwayBack,this.onVisible=a.onVisible,this.onHidden=a.onHidden),c=this,b=function(){return c.onActive()},window.onclick=b,window.onmousemove=b,window.onmouseenter=b,window.onkeydown=b,window.onscroll=b,window.onmousewheel=b}return a.isAway=!1,a.awayTimeout=3e3,a.awayTimestamp=0,a.awayTimer=null,a.onAway=null,a.onAwayBack=null,a.onVisible=null,a.onHidden=null,a.prototype.onActive=function(){return this.awayTimestamp=(new Date).getTime()+this.awayTimeout,this.isAway&&(this.onAwayBack&&this.onAwayBack(),this.start()),this.isAway=!1,!0},a.prototype.start=function(){var a;return this.listener||(this.listener=function(){return a.handleVisibilityChange()},document.addEventListener("visibilitychange",this.listener,!1),document.addEventListener("webkitvisibilitychange",this.listener,!1),document.addEventListener("msvisibilitychange",this.listener,!1)),this.awayTimestamp=(new Date).getTime()+this.awayTimeout,null!==this.awayTimer&&clearTimeout(this.awayTimer),a=this,this.awayTimer=setTimeout(function(){return a.checkAway()},this.awayTimeout+100),this},a.prototype.stop=function(){return null!==this.awayTimer&&clearTimeout(this.awayTimer),null!==this.listener&&(document.removeEventListener("visibilitychange",this.listener),document.removeEventListener("webkitvisibilitychange",this.listener),document.removeEventListener("msvisibilitychange",this.listener),this.listener=null),this},a.prototype.setAwayTimeout=function(a){return this.awayTimeout=parseInt(a,10),this},a.prototype.checkAway=function(){var a,b;return b=(new Date).getTime(),b<this.awayTimestamp?(this.isAway=!1,a=this,void(this.awayTimer=setTimeout(function(){return a.checkAway()},this.awayTimestamp-b+100))):(null!==this.awayTimer&&clearTimeout(this.awayTimer),this.isAway=!0,this.onAway?this.onAway():void 0)},a.prototype.handleVisibilityChange=function(){if(document.hidden||document.msHidden||document.webkitHidden){if(this.onHidden)return this.onHidden()}else if(this.onVisible)return this.onVisible()},a}(),"function"==typeof define&&define.amd?define([],a):"object"==typeof exports?module.exports=a:window.Idle=a}).call(this);

'use strict';

(function (angular) {
    angular.module('znk.infra.presence').provider('PresenceService', function () {

        var AuthSrvName;

        this.setAuthServiceName = function (authServiceName) {
            AuthSrvName = authServiceName;
        };

        this.$get = [
            '$log', '$injector', 'ENV', '$document',
            function ($log, $injector, ENV, $document) {
                var PresenceService = {};
                var authService = $injector.get(AuthSrvName);
                var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

                PresenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2,
                    'AWAY': 3
                };

                PresenceService.addListeners = function () {
                    var authData = authService.getAuth();
                    if (authData) {

                        addIdleScriptTag();

                        var amOnline = rootRef.child('.info/connected');
                        var userRef = rootRef.child('presence/' + authData.uid);
                        amOnline.on('value', function (snapshot) {
                            if (snapshot.val()) {
                                userRef.onDisconnect().remove();
                                userRef.set(PresenceService.userStatus.ONLINE);
                            }
                        });

                        $document[0].onIdle = function () {
                            userRef.set(PresenceService.userStatus.IDLE);
                        };
                        $document[0].onAway = function () {
                            userRef.set(PresenceService.userStatus.AWAY);
                        };
                        $document[0].onBack = function () {
                            userRef.set(PresenceService.userStatus.ONLINE);
                        };
                    }
                };

                PresenceService.getUserStatus = function (userId) {
                    return rootRef.child('presence/' + userId);
                };

                function addIdleScriptTag () {
                    var script = $document[0].createElement('script');
                    script.type = 'text/javascript';
                    script.src = './idle.js';
                    $document[0].head.appendChild(script);

                }

                return PresenceService;
            }];
    });
})(angular);

angular.module('znk.infra.presence').run(['$templateCache', function($templateCache) {

}]);
