// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var app = angular.module('triviapp', ['ionic', 'ngCordova', 'ngCordovaOauth', 'ngStorage']);

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

app.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
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

  $httpProvider.interceptors.push(['$q', '$location', '$localStorage', function ($q, $location, $localStorage) {
     return {
         'request': function (config) {
             config.headers = config.headers || {};
             if ($localStorage.token) {
                 config.headers.token = $localStorage.token;
             }
             return config;
         },
         'responseError': function (response) {
             if (response.status === 401 || response.status === 403) {
                 $location.path('/');
             }
             return $q.reject(response);
         }
     };
  }]);
})

app.controller('LandingController', ['$scope', '$location', '$cordovaOauth', '$http', '$localStorage', function($scope, $location, $cordovaOauth, $http, $localStorage){
  $scope.loading = false;

  $scope.login = function() {
    $cordovaOauth.google("967722119321-lp0tvih37uh7ulcochcerlai30girchh.apps.googleusercontent.com", ["https://www.googleapis.com/auth/plus.profile.emails.read"]).then(function(result) {
        $scope.loading = true;
        $http.post('https://trivia-app-api.herokuapp.com/auth/google/mobile', result).then(function(user){
          $localStorage.token = user.data.data.token;
          console.log($localStorage.token);
          $scope.loading = false;
          if(user.data.data.profile_name){
            $location.path('/homepage');
          }else{
            $location.path('/username');
          }
        })
    }, function(error) {
        console.log(error);
    });
}
}])

app.controller('UsernameController', ['$scope', '$location', '$http', function($scope, $location, $http){
  $scope.post={};
  $scope.submitName = function(){
    console.log('submiting');
    $http.patch('https://trivia-app-api.herokuapp.com/users/username', $scope.post).then(function(update){
      console.log(update);
      $location.path('/homepage');
    });

  }
}])

app.controller('HomepageController', ['$scope', '$location', 'PlayerService', function($scope, $location, PlayerService){
  PlayerService.getPlayerProfile().then(function(profile){
    console.log(profile);
    $scope.player = profile;
    $scope.$apply();
  })
  $scope.joinGame = function(){
    $location.path('/joinGame');
  }
}])


app.controller('PlayGameController', ['$scope', '$location', 'PlayerService', function($scope, $location, PlayerService){
  PlayerService.getPlayerProfile().then(function(profile){
    $scope.player = profile;
    $scope.game = {};
    $scope.game.username = profile.profile_name;
    $scope.game.userID = profile.id;
    $scope.game.imgURL = profile.image_url;
    $scope.$apply();
  })
  $scope.returnToMenu = false;
  $scope.joined = false;
  $scope.activeRound = 1;
  var socket = io('https://trivia-app-api.herokuapp.com/');
  socket.on('message', function(message){
    console.log(message);
    $scope.$apply();
  });
  socket.on('fail', function(message){
    $scope.gameMessage = message;
  });
  socket.on('gameToken', function(token){
    $scope.joined = true
    $scope.gameMessage = 'Waiting for host to begin game'
  })
  socket.on('question', function(question){
    console.log(question);
    $scope.gameMessage=question.question
    $scope.players = {}
    $scope.incomingQuestion = question;
    $scope.$apply();
  });
  socket.on('round over', function(gameState){
    $scope.gameMessage="Correct Answer was "+gameState.answer+" Current Standings after round: "+$scope.activeRound;
    $scope.activeRound++;
    $scope.incomingQuestion = {};
    $scope.players = gameState.players;
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

    console.log($scope.game)
    socket.emit('joinGame', $scope.game)
  }



  $scope.back = function(){
    $location.path('/homepage');
  }
  $scope.submitResponse = function(key){
    $scope.game.response = key;
    $scope.game.round = $scope.incomingQuestion.round;
    console.log($scope.game);
    socket.emit('answer', $scope.game);
  }

}]);

app.factory('PlayerService', ['$http', function($http){
  var playerActions = {};
  var player=null;
  playerActions.getPlayerProfile = function(){
    return new Promise(function(resolve, reject){
      if(player){
        profile={
          id: player.id,
          email: player.email,
          profile_name: player.profile_name,
          image_url: player.image_url,
        };
        resolve(profile);
      }
      else{
        $http.get('https://trivia-app-api.herokuapp.com/players').then(function(newPlayer){
          newPlayer = newPlayer.data.data;
          player = newPlayer;
          profile={
              id: player.id,
              email: player.email,
              profile_name: player.profile_name,
              image_url: player.image_url,
              rating: player.rating,
          };
          resolve(profile);
        }).catch(function(error){
          reject(error);
        });
      }
    });
  };
  playerActions.clearPlayer = function(){
    player=null;
  };

  return playerActions;
}]);
