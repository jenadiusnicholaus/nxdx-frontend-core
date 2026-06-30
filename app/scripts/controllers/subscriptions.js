export function SubscriptionsCtrl(
  $rootScope,
  $scope,
  $uibModal,
  $http,
  config,
  Alerting,
  Api,
) {
  const CORE_API_URL =
    config.protocol + "://" + config.host + ":" + config.port;

  const queryError = function (err) {
    Alerting.AlertAddServerMsg(err.status);
  };

  $scope.activeTab = "plans";
  $scope.plans = [];
  $scope.mySubscriptions = [];
  $scope.allSubscriptions = [];

  // Dynamic role check to ensure consistent admin detection
  $scope.isAdmin = function () {
    return $rootScope.userGroupAdmin === true;
  };

  /* -------------------------Load Data---------------------------- */
  const loadPlans = function () {
    $http
      .get(`${CORE_API_URL}/subscription-plans`, { withCredentials: true })
      .then(function (response) {
        $scope.plans = response.data;
      }, queryError);
  };

  const loadMySubscriptions = function () {
    $http
      .get(`${CORE_API_URL}/subscriptions/mine`, { withCredentials: true })
      .then(function (response) {
        // Fetch plan data separately for each subscription
        const subscriptions = response.data;
        const promises = subscriptions.map(function (sub) {
          if (sub.planId && typeof sub.planId === "string") {
            return $http
              .get(`${CORE_API_URL}/subscription-plans/${sub.planId}`, {
                withCredentials: true,
              })
              .then(function (planResponse) {
                sub.planId = planResponse.data;
                return sub;
              })
              .catch(function () {
                return sub; // Return original if plan fetch fails
              });
          }
          return Promise.resolve(sub);
        });

        Promise.all(promises).then(function (enrichedSubscriptions) {
          $scope.mySubscriptions = enrichedSubscriptions;
        });
      }, queryError);
  };

  const loadAllSubscriptions = function () {
    $http
      .get(`${CORE_API_URL}/subscriptions`, { withCredentials: true })
      .then(function (response) {
        $scope.allSubscriptions = response.data;
      }, queryError);
  };

  loadPlans();
  loadMySubscriptions();
  if ($scope.isAdmin()) {
    loadAllSubscriptions();
  }

  $scope.$on("subscriptionsChanged", function () {
    loadMySubscriptions();
    if ($scope.isAdmin()) loadAllSubscriptions();
  });
  $scope.$on("plansChanged", loadPlans);
  /* -------------------------End Load Data---------------------------- */

  /* -------------------------Subscription Plans CRUD---------------------------- */
  $scope.openAddPlanModal = function (existingPlan) {
    $uibModal
      .open({
        template: require("~/views/subscriptions.html").match(
          /<script[^>]*id="planModal"[^>]*>([\s\S]*?)<\/script>/m,
        )[1],
        controller: function ($scope, $uibModalInstance) {
          $scope.isEdit = !!existingPlan;
          $scope.plan = existingPlan
            ? angular.copy(existingPlan)
            : {
                name: "",
                description: "",
                price: 0,
                currency: "usd",
                interval: "month",
                duration: 30,
                featuresText: "",
                channelLimit: 0,
                requestLimit: 0,
                allowedEndpoints: "*",
                active: true,
              };

          if (existingPlan && existingPlan.features) {
            $scope.plan.featuresText = existingPlan.features.join("\n");
          }

          $scope.save = function () {
            const planToSave = angular.copy($scope.plan);
            if (planToSave.featuresText) {
              planToSave.features = planToSave.featuresText
                .split("\n")
                .filter((f) => f.trim());
            }
            if (typeof planToSave.allowedEndpoints === "string") {
              planToSave.allowedEndpoints = planToSave.allowedEndpoints
                .split(",")
                .map((e) => e.trim());
            }
            delete planToSave.featuresText;
            $uibModalInstance.close(planToSave);
          };
          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };
        },
        size: "md",
      })
      .result.then(function (plan) {
        if (existingPlan) {
          $http
            .put(
              `${CORE_API_URL}/subscription-plans/${existingPlan._id}`,
              plan,
              { withCredentials: true },
            )
            .then(
              function () {
                Alerting.AlertAddMsg(
                  "top",
                  "success",
                  "Plan updated successfully",
                );
                $scope.$emit("plansChanged");
              },
              function (err) {
                Alerting.AlertAddMsg(
                  "top",
                  "danger",
                  "Failed to update plan: " + (err.data || err.statusText),
                );
              },
            );
        } else {
          $http
            .post(`${CORE_API_URL}/subscription-plans`, plan, {
              withCredentials: true,
            })
            .then(
              function () {
                Alerting.AlertAddMsg(
                  "top",
                  "success",
                  "Plan created successfully",
                );
                $scope.$emit("plansChanged");
              },
              function (err) {
                Alerting.AlertAddMsg(
                  "top",
                  "danger",
                  "Failed to create plan: " + (err.data || err.statusText),
                );
              },
            );
        }
      });
  };

  $scope.deletePlan = function (plan) {
    if (confirm('Delete plan "' + plan.name + '"? This cannot be undone.')) {
      $http
        .delete(`${CORE_API_URL}/subscription-plans/${plan._id}`, {
          withCredentials: true,
        })
        .then(function () {
          Alerting.AlertAddMsg("top", "success", "Plan deleted");
          $scope.$emit("plansChanged");
        }, queryError);
    }
  };
  /* -------------------------End Subscription Plans CRUD---------------------------- */

  /* -------------------------Admin Subscription CRUD---------------------------- */
  $scope.openAddSubscriptionModal = function (existingSub) {
    $uibModal
      .open({
        template: require("~/views/subscriptions.html").match(
          /<script[^>]*id="subscriptionModal"[^>]*>([\s\S]*?)<\/script>/m,
        )[1],
        controller: function ($scope, $uibModalInstance, plans) {
          $scope.isEdit = !!existingSub;
          $scope.currentSubscription = existingSub
            ? angular.copy(existingSub)
            : {
                clientID: "",
                planId: "",
                status: "pending",
                paymentStatus: "pending",
                startDate: new Date().toISOString().split("T")[0],
                endDate: "",
              };
          $scope.plans = plans;

          $scope.save = function () {
            $uibModalInstance.close($scope.currentSubscription);
          };
          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };
        },
        resolve: {
          plans: function () {
            return $scope.plans;
          },
        },
        size: "lg",
      })
      .result.then(function (sub) {
        if (existingSub) {
          $http
            .put(`${CORE_API_URL}/subscriptions/${existingSub._id}`, sub, {
              withCredentials: true,
            })
            .then(
              function () {
                Alerting.AlertAddMsg("top", "success", "Subscription updated");
                $scope.$emit("subscriptionsChanged");
              },
              function (err) {
                Alerting.AlertAddMsg(
                  "top",
                  "danger",
                  "Failed: " + (err.data || err.statusText),
                );
              },
            );
        } else {
          $http
            .post(`${CORE_API_URL}/subscriptions`, sub, {
              withCredentials: true,
            })
            .then(
              function () {
                Alerting.AlertAddMsg("top", "success", "Subscription created");
                $scope.$emit("subscriptionsChanged");
              },
              function (err) {
                Alerting.AlertAddMsg(
                  "top",
                  "danger",
                  "Failed: " + (err.data || err.statusText),
                );
              },
            );
        }
      });
  };

  $scope.editSubscription = function (sub) {
    $scope.openAddSubscriptionModal(sub);
  };

  $scope.toggleStatus = function (sub) {
    const newStatus = sub.status === "active" ? "suspended" : "active";
    $http
      .put(
        `${CORE_API_URL}/subscriptions/${sub._id}`,
        { status: newStatus },
        { withCredentials: true },
      )
      .then(function () {
        Alerting.AlertAddMsg("top", "success", "Subscription status updated");
        $scope.$emit("subscriptionsChanged");
      }, queryError);
  };

  $scope.deleteSubscription = function (sub) {
    if (confirm('Delete subscription for "' + sub.clientID + '"?')) {
      $http
        .delete(`${CORE_API_URL}/subscriptions/${sub._id}`, {
          withCredentials: true,
        })
        .then(function () {
          Alerting.AlertAddMsg("top", "success", "Subscription deleted");
          $scope.$emit("subscriptionsChanged");
        }, queryError);
    }
  };
  /* -------------------------End Admin Subscription CRUD---------------------------- */

  /* -------------------------Client Subscribe Flow---------------------------- */
  $scope.subscribeToPlan = function (plan) {
    $uibModal.open({
      template: require("~/views/subscriptions.html").match(
        /<script[^>]*id="subscribeModal"[^>]*>([\s\S]*?)<\/script>/m,
      )[1],
      controller: function ($scope, $uibModalInstance, Api) {
        $scope.selectedPlan = plan;
        $scope.formData = {
          clientID: "",
          phoneNumber: "",
        };
        $scope.paymentInitiated = false;
        $scope.paymentMessage = null;
        $scope.loading = false;
        $scope.error = null;
        $scope.clients = [];
        $scope.showCreateClient = false;
        $scope.newClient = {
          clientID: "",
          name: "",
          clientDomain: "",
        };

        // Load user's clients
        Api.Clients.query(
          function (clients) {
            $scope.clients = clients;
            $scope.showCreateClient = clients.length === 0;
          },
          function () {
            $scope.showCreateClient = true;
          },
        );

        $scope.createClient = function () {
          if (!$scope.newClient.clientID || !$scope.newClient.name) return;
          $scope.loading = true;
          $scope.error = null;

          const client = new Api.Clients();
          client.clientID = $scope.newClient.clientID;
          client.name = $scope.newClient.name;
          client.clientDomain = $scope.newClient.clientID + "@openhim.org";
          client.ownerEmail = $rootScope.sessionUser;
          // Clients need at least one role to be usable on channels; default
          // subscription clients to a "subscriber" role (editable later).
          client.roles = ["subscriber"];

          client.$save(
            function (savedClient) {
              $scope.clients.push(savedClient);
              $scope.formData.clientID = savedClient.clientID;
              $scope.showCreateClient = false;
              $scope.loading = false;
            },
            function (err) {
              $scope.loading = false;
              $scope.error = err.data || err.statusText;
            },
          );
        };

        $scope.startPayment = function () {
          if (!$scope.formData.clientID || !$scope.formData.phoneNumber) {
            $scope.error = "Client ID and mobile money phone number are required";
            return;
          }
          $scope.loading = true;
          $scope.error = null;
          $http
            .post(
              `${CORE_API_URL}/subscriptions/pay`,
              {
                clientID: $scope.formData.clientID,
                planId: $scope.selectedPlan._id,
                phoneNumber: $scope.formData.phoneNumber,
              },
              { withCredentials: true },
            )
            .then(
              function (response) {
                $scope.loading = false;
                $scope.paymentInitiated = true;
                $scope.paymentMessage =
                  (response.data && response.data.message) ||
                  "A payment prompt has been sent to your phone. Enter your mobile money PIN to authorise.";
                $scope.$emit("subscriptionsChanged");
              },
              function (err) {
                $scope.loading = false;
                $scope.error =
                  (err.data && (err.data.message || err.data)) ||
                  err.statusText ||
                  "Payment could not be initiated";
              },
            );
        };

        $scope.done = function () {
          $scope.$emit("subscriptionsChanged");
          $uibModalInstance.close();
        };

        $scope.cancel = function () {
          $uibModalInstance.dismiss("cancel");
        };
      },
      size: "md",
    });
  };

  $scope.renewSubscription = function (sub) {
    $scope.subscribeToPlan(sub.planId);
  };

  $scope.upgradeSubscription = function (sub) {
    $scope.activeTab = "plans";
    Alerting.AlertAddMsg("top", "info", "Select a higher-tier plan to upgrade");
  };
  /* -------------------------End Client Subscribe Flow---------------------------- */

  /* -------------------------Helpers---------------------------- */
  $scope.statusClass = function (status) {
    return (
      {
        active: "label-success",
        pending: "label-warning",
        expired: "label-danger",
        cancelled: "label-default",
        suspended: "label-danger",
      }[status] || "label-default"
    );
  };

  $scope.paymentStatusClass = function (status) {
    return (
      {
        paid: "label-success",
        pending: "label-warning",
        failed: "label-danger",
        refunded: "label-default",
      }[status] || "label-default"
    );
  };

  $scope.isSubscribed = function (planId) {
    if (!planId || !$scope.mySubscriptions) return false;
    return $scope.mySubscriptions.some(function (sub) {
      if (!sub.planId || sub.status !== "active") return false;
      // Handle both cases: planId as string or as object with _id
      const subPlanId =
        typeof sub.planId === "string" ? sub.planId : sub.planId._id;
      return subPlanId === planId;
    });
  };
  /* -------------------------End Helpers---------------------------- */
}
