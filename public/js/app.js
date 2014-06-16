"use strict";

var app = angular.module('lbs', [
	'perfect_scrollbar',
  'btford.socket-io',
  'mgcrea.ngStrap'
]);

function aoMax(a, k) {
    return Math.max.apply(Math, a.map(function(o){ return o[k]; }))
}

app.factory('socket', ['socketFactory', function(socketFactory) {
    return socketFactory();
}]);

app.controller('top', ['$scope', 'socket', function($scope, socket) {

    $scope.top = [];
    $scope.counters = {};
    $scope.total = 0;

    socket.on('countersUpdated', function(counters) {
        $scope.counters = counters;
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
        }
    });
}]);