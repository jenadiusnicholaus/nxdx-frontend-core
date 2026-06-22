export function SidebarCtrl($scope, $location, $http, config) {
  const CORE_API_URL =
    config.protocol + "://" + config.host + ":" + config.port;
  let hasActiveSubscription = false;

  // Check if user has active subscription
  const checkSubscription = function () {
    $http
      .get(`${CORE_API_URL}/subscriptions/mine`, { withCredentials: true })
      .then(function (response) {
        hasActiveSubscription = response.data.some(function (sub) {
          return sub.status === "active";
        });
      })
      .catch(function () {
        hasActiveSubscription = false;
      });
  };

  // Check subscription on load and on route changes
  checkSubscription();
  $scope.$on("$routeChangeSuccess", checkSubscription);

  $scope.isCurrent = function (path) {
    if (path.length > 1 && $location.path().substr(0, path.length) === path) {
      return true;
    } else if ($location.path() === path) {
      return true;
    } else {
      return false;
    }
  };

  $scope.checkSubscriptionBeforeNavigate = function (path) {
    // Allow navigation to subscriptions page regardless of subscription status
    if (path === "/subscriptions") {
      return true;
    }
    // Allow navigation if user has active subscription
    if (hasActiveSubscription) {
      return true;
    }
    // Redirect to subscriptions page if no active subscription
    $location.path("/subscriptions");
    return false;
  };

  $(window).scroll(function (e) {
    // Get the position of the location where the scroller starts.
    const scrollerAnchor = $(".scollNavAnchor").offsetParent().scrollTop();
    if (scrollerAnchor >= 50) {
      // show the scroll to button
      $("#scrollToTop").css("display", "block");
      $(".header").css("box-shadow", "0px 0px 10px #888");
    } else {
      // hide the scroll to button
      $("#scrollToTop").css("display", "none");
      $(".header").css("box-shadow", "none");
    }
  });
}
