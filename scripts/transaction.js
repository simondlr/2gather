angular.module('2gather').factory('Transaction', function($http, $q) {
    var baseUrl = 'http://'+location.hostname+':3000/apis/2gather'; //url to poll transactions
    var timeoutConfig = 5000; //in milliseconds

    function pollTransactionState(transactionHash) {
        var defer = $q.defer();
        $http.get(baseUrl + '/txs/' + transactionHash).error(defer.reject).success(function(res, status){
          res = parseInt(res);
          switch (res) {
              case 1: //pending
                  setTimeout(function() { //recursively poll the transaction stage until response changes
                      pollTransactionState(transactionHash).then(defer.resolve);
                  }, timeoutConfig);
                  break;
              case 2: //error
                  defer.reject(res, status);
                  break;
              case 3: //success
                  defer.resolve(res, status);
                  break;
          }
        });

        return defer.promise;

    };

    return function newTransaction(method, url, body) {
        var defer = $q.defer();
        if(method === 'GET')
          $http.get(baseUrl + '/' + url).success(defer.resolve).error(defer.reject);
        else
          $http({method: method, url: baseUrl + '/' + url, data: body}).success(function(hash) {
            hash = hash.substr(1,hash.length-2); //hash surrounded in by API
            pollTransactionState(hash).then(defer.resolve, defer.reject);
          }).error(defer.reject);

        return defer.promise;
    };
});
