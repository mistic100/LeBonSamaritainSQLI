(function(){
"use strict";

var app = angular.module('lbs', [
    'ngSanitize',
    'perfect_scrollbar',
    'btford.socket-io',
    'mgcrea.ngStrap',
    'angular-smilies',
    'angularMoment',
    'nodesGraph'
]);

function aoMax(a, k) {
    return Math.max.apply(Math, a.map(function(o){ return o[k]; }))
}

app.run(['amMoment', function(amMoment) {
  amMoment.changeLanguage('fr');
}]);

app.factory('socket', ['socketFactory', function(socketFactory) {
    return socketFactory();
}]);

app.controller('top', ['$scope', 'socket', function($scope, socket) {

    $scope.top = [];
    $scope.hashtags = [];
    $scope.counters = {};
    $scope.total = 0;
    $scope.tweets = [];

    socket.on('countersUpdated', function(counters) {
        $scope.$apply(function() {
            $scope.counters = counters;
        });
    });
    
    socket.on('newTweets', function(tweets) {
        Array.prototype.unshift.apply($scope.tweets, tweets);
    });
    
    $scope.$watch('counters', function(counters) {
        if (!$.isEmptyObject(counters)) {
            $scope.total = 0;
            
            var max = aoMax(counters.helpers, 'count');
            counters.helpers.forEach(function(user) {
                user.percent = Math.round(user.count/max*100);
                $scope.total+= user.count;
            });
            
            counters.helpers.sort(function(a, b) {
                if (b.count==a.count) {
                    return a.name.localeCompare(b.name);
                }
                return b.count-a.count;
            });
            $scope.top = counters.helpers.slice(0, 3);
            
            max = aoMax(counters.helped, 'count');
            counters.helped.forEach(function(user) {
                user.percent = Math.round(user.count/max*100);
            });
            
            $scope.hashtags = [];
            counters.hashtags.forEach(function(tag) {
                $scope.hashtags.push({
                    text: '#'+tag.name,
                    weight: tag.count
                });
            });
        }
    });
}]);

app.filter('tweet', function() {
    return function(input, target) {
        input = input.replace(new RegExp('([^@]'+target+')', 'gi'), '<span class="target">$1</span>');
        input = input.replace(/#([0-9a-z_-]+)/gi, '<a href="https://twitter.com/hashtag/$1">#$1</a>');
        input = input.replace(/@([0-9a-z_-]+)/gi, '<a href="https://twitter.com/$1">@$1</a>');
        return input;
    };
});

}());