export function SubscriptionsCtrl ($rootScope, $scope, $uibModal, $http, Alerting) {
  const MEDIATOR_URL = 'http://localhost:3000'

  const queryError = function (err) {
    Alerting.AlertAddServerMsg(err.status)
  }

  /* -------------------------Load Subscriptions---------------------------- */
  const loadSubscriptions = function () {
    $http.get(`${MEDIATOR_URL}/subscriptions`)
      .then(function (response) {
        $scope.subscriptions = response.data
        if (response.data.length === 0) {
          Alerting.AlertAddMsg('bottom', 'warning', 'There are currently no subscriptions created')
        } else {
          Alerting.AlertReset('bottom')
        }
      }, queryError)
  }

  loadSubscriptions()

  $scope.$on('subscriptionsChanged', function () {
    loadSubscriptions()
  })
  /* -------------------------End Load Subscriptions---------------------------- */

  /* -------------------------Add/Edit Subscription Modal---------------------------- */
  $scope.openAddSubscriptionModal = function () {
    Alerting.AlertReset()
    $scope.isEdit = false
    $scope.currentSubscription = {
      subscriberId: '',
      subscriberName: '',
      endpoint: '',
      dataType: '',
      format: 'json',
      authentication: {
        type: 'none',
        credentials: {}
      },
      active: true
    }

    $uibModal.open({
      template: require('~/views/subscriptions.html').match(/<script[^>]*>([\s\S]*?)<\/script>/m)[1],
      controller: function ($scope, $uibModalInstance) {
        $scope.isEdit = false
        $scope.currentSubscription = {
          subscriberId: '',
          subscriberName: '',
          endpoint: '',
          dataType: '',
          format: 'json',
          authentication: {
            type: 'none',
            credentials: {}
          },
          active: true
        }

        $scope.saveSubscription = function () {
          $uibModalInstance.close($scope.currentSubscription)
        }

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel')
        }
      },
      size: 'lg'
    }).result.then(function (subscription) {
      saveSubscription(subscription)
    })
  }

  $scope.editSubscription = function (subscription) {
    Alerting.AlertReset()
    $scope.isEdit = true
    $scope.currentSubscription = angular.copy(subscription)

    $uibModal.open({
      template: require('~/views/subscriptions.html').match(/<script[^>]*>([\s\S]*?)<\/script>/m)[1],
      controller: function ($scope, $uibModalInstance, subscription) {
        $scope.isEdit = true
        $scope.currentSubscription = angular.copy(subscription)

        $scope.saveSubscription = function () {
          $uibModalInstance.close($scope.currentSubscription)
        }

        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel')
        }
      },
      resolve: {
        subscription: function () {
          return subscription
        }
      },
      size: 'lg'
    }).result.then(function (subscription) {
      updateSubscription(subscription)
    })
  }

  const saveSubscription = function (subscription) {
    $http.post(`${MEDIATOR_URL}/subscriptions`, subscription)
      .then(function (response) {
        Alerting.AlertAddMsg('top', 'success', 'Subscription created successfully')
        $scope.$emit('subscriptionsChanged')
      }, function (error) {
        Alerting.AlertAddMsg('top', 'danger', 'Failed to create subscription: ' + error.data.error)
      })
  }

  const updateSubscription = function (subscription) {
    $http.put(`${MEDIATOR_URL}/subscriptions/${subscription._id}`, subscription)
      .then(function (response) {
        Alerting.AlertAddMsg('top', 'success', 'Subscription updated successfully')
        $scope.$emit('subscriptionsChanged')
      }, function (error) {
        Alerting.AlertAddMsg('top', 'danger', 'Failed to update subscription: ' + error.data.error)
      })
  }
  /* -------------------------End Add/Edit Subscription Modal---------------------------- */

  /* -------------------------Toggle Subscription Status---------------------------- */
  $scope.toggleSubscriptionStatus = function (subscription) {
    subscription.active = !subscription.active
    updateSubscription(subscription)
  }
  /* -------------------------End Toggle Subscription Status---------------------------- */

  /* -------------------------Delete Subscription---------------------------- */
  $scope.deleteSubscription = function (subscription) {
    if (confirm('Are you sure you want to delete this subscription?')) {
      $http.delete(`${MEDIATOR_URL}/subscriptions/${subscription._id}`)
        .then(function (response) {
          Alerting.AlertAddMsg('top', 'success', 'Subscription deleted successfully')
          $scope.$emit('subscriptionsChanged')
        }, function (error) {
          Alerting.AlertAddMsg('top', 'danger', 'Failed to delete subscription: ' + error.data.error)
        })
    }
  }
  /* -------------------------End Delete Subscription---------------------------- */
}
