#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthServicePlugin, "HealthService",
  CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(getSleepData, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(getHeartRateData, CAPPluginReturnPromise);
)
