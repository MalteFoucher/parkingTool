var app = angular.module('myLogin',[]);
app.controller('loginControl', ['$scope','$window', function ($scope, $window)
{
	console.log("Wird die scheiße püberhaupt ?");
	$scope.sls=$window.loginStatus;
	
}]);