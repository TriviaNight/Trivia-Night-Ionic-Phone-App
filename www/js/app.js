// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('triviapp', ['ionic']);

app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/login');

  $stateProvider.state('login', {
    url: '/login',
    templateUrl: 'templates/landing.html',
    controller: 'LandingController',
  }).state('username', {
    url: '/username',
    templateUrl: 'templates/username.html',
    controller: 'UsernameController',
  }).state('homepage', {
    url: '/homepage',
    templateUrl: 'templates/homepage.html',
    controller: 'HomepageController',
  }).state('joinGame', {
    url: '/joinGame',
    templateUrl: 'templates/join.html',
    controller: 'PlayGameController',
  });
})

app.controller('LandingController', ['$scope', '$location', function($scope, $location){
  $scope.login = function(){
    $location.path('/username');
  // window.location='http://localhost:3000/auth/google';
  }
}])

app.controller('UsernameController', ['$scope', '$location', function($scope, $location){
  $scope.submitName = function(){
    $location.path('/homepage');
  }
}])

app.controller('HomepageController', ['$scope', '$location', function($scope, $location){
  $scope.joinGame = function(){
    $location.path('/joinGame');
  }
}])


app.controller('PlayGameController', ['$scope', '$location', function($scope){
  $scope.joined = false;
  $scope.activeRound = 1;
  var socket = io('http://localhost:3000/');
  socket.on('message', function(message){
    console.log(message);
  });
  socket.on('question', function(question){
    console.log(question);
    $scope.gameMessage=question.question
    $scope.players = {}
    $scope.incomingQuestion = question;
    $scope.$apply();
  });
  socket.on('round over', function(players){
    $scope.gameMessage="Current Standings after round: "+$scope.activeRound;
    $scope.activeRound++;
    $scope.incomingQuestion = {};
    $scope.players = players;
    $scope.$apply();
  });
  socket.on('game over', function(players){
    $scope.gameMessage="Final Standings";
    $scope.incomingQuestion = {};
    $scope.players = players;
    $scope.returnToMenu = true;
    $scope.$apply();
  });
  $scope.$on("$destroy", function(){
    socket.disconnect();
  });
  $scope.joinGame = function(){
    $scope.joined = true
    $scope.gameMessage = 'Waiting for host to begin game'
    console.log($scope.game)
    socket.emit('joinGame', $scope.game)
  }

  $scope.back = function(){
    $location.path('/homepage');
  }
  $scope.submitResponse = function(key){
    $scope.game.response = key;
    $scope.game.round = $scope.question.round;
    console.log($scope.game);
    socket.emit('answer', $scope.game);
  }
  $scope.game = {};
  $scope.game.name = 'm';
  $scope.game.password = 'm';
  $scope.game.username = 'prancing pony';
  $scope.game.userID = 1;
  $scope.game.imgURL = 'https://lh5.googleusercontent.com/-z8Rv5svpDoU/AAAAAAAAAAI/AAAAAAAAAVM/hR5eR81ACX8/photo.jpg?sz=50'
}]);
