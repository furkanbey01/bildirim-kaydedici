const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

function withNotificationListenerManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    const serviceExists = application.service.some(
      (s) => s.$?.["android:name"] === ".NotificationListenerService"
    );

    if (!serviceExists) {
      application.service.push({
        $: {
          "android:name": ".NotificationListenerService",
          "android:label": "Bildirim Kaydedici",
          "android:exported": "true",
          "android:permission": "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.service.notification.NotificationListenerService",
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
}

function withNotificationListenerJava(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName =
        config.android?.package || "com.bildirimkaydedici";
      const packagePath = packageName.replace(/\./g, "/");
      const javaDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packagePath
      );

      fs.mkdirSync(javaDir, { recursive: true });

      const serviceCode = `package ${packageName};

import android.content.ComponentName;
import android.content.Intent;
import android.os.IBinder;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import android.content.pm.PackageManager;
import android.content.pm.ApplicationInfo;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class NotificationListenerService extends android.service.notification.NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            Notification notification = sbn.getNotification();
            Bundle extras = notification.extras;

            String packageName = sbn.getPackageName();
            String appName = getAppName(packageName);

            WritableMap params = Arguments.createMap();
            params.putString("packageName", packageName);
            params.putString("appName", appName);

            String title = extras.getCharSequence(Notification.EXTRA_TITLE) != null
                    ? extras.getCharSequence(Notification.EXTRA_TITLE).toString() : "";
            String text = extras.getCharSequence(Notification.EXTRA_TEXT) != null
                    ? extras.getCharSequence(Notification.EXTRA_TEXT).toString() : "";
            String bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT) != null
                    ? extras.getCharSequence(Notification.EXTRA_BIG_TEXT).toString() : "";
            String subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT) != null
                    ? extras.getCharSequence(Notification.EXTRA_SUB_TEXT).toString() : "";

            params.putString("title", title);
            params.putString("text", text);
            params.putString("bigText", bigText);
            params.putString("subText", subText);

            String ticker = notification.tickerText != null ? notification.tickerText.toString() : "";
            params.putString("ticker", ticker);

            long postTime = sbn.getPostTime();
            params.putDouble("timestamp", postTime);

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            params.putString("postTime", sdf.format(new Date(postTime)));

            String category = notification.category != null ? notification.category : "";
            params.putString("category", category);
            params.putInt("priority", notification.priority);
            params.putBoolean("isOngoing", (notification.flags & Notification.FLAG_ONGOING_EVENT) != 0);
            params.putBoolean("isGroupSummary", (notification.flags & Notification.FLAG_GROUP_SUMMARY) != 0);

            String groupKey = sbn.getGroupKey() != null ? sbn.getGroupKey() : "";
            params.putString("groupKey", groupKey);

            String sortKey = notification.getSortKey() != null ? notification.getSortKey() : "";
            params.putString("sortKey", sortKey);

            String tag = sbn.getTag() != null ? sbn.getTag() : "";
            params.putString("tag", tag);

            params.putInt("number", notification.number);
            params.putInt("visibility", notification.visibility);

            WritableArray actions = Arguments.createArray();
            if (notification.actions != null) {
                for (Notification.Action action : notification.actions) {
                    if (action.title != null) {
                        actions.pushString(action.title.toString());
                    }
                }
            }
            params.putArray("actions", actions);

            WritableMap extrasMap = Arguments.createMap();
            if (extras != null) {
                for (String key : extras.keySet()) {
                    try {
                        Object value = extras.get(key);
                        if (value != null) {
                            extrasMap.putString(key, value.toString());
                        }
                    } catch (Exception ignored) {}
                }
            }
            params.putMap("extras", extrasMap);

            if (notification.color != 0) {
                params.putString("iconColor", String.format("#%06X", (0xFFFFFF & notification.color)));
            } else {
                params.putNull("iconColor");
            }

            sendEvent(params);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private String getAppName(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(packageName, 0);
            return (String) pm.getApplicationLabel(ai);
        } catch (Exception e) {
            return packageName;
        }
    }

    private void sendEvent(WritableMap params) {
        try {
            MainApplication app = (MainApplication) getApplication();
            ReactContext reactContext = app.getReactNativeHost().getReactInstanceManager().getCurrentReactContext();
            if (reactContext != null) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNotificationReceived", params);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {}

    @Override
    public IBinder onBind(Intent intent) {
        return super.onBind(intent);
    }
}
`;

      fs.writeFileSync(
        path.join(javaDir, "NotificationListenerService.java"),
        serviceCode
      );

      const moduleCode = `package ${packageName};

import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.Set;

public class RNNotificationListenerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public RNNotificationListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "RNNotificationListener";
    }

    @ReactMethod
    public void isNotificationAccessGranted(Promise promise) {
        try {
            String packageName = reactContext.getPackageName();
            String flat = Settings.Secure.getString(reactContext.getContentResolver(),
                    "enabled_notification_listeners");
            boolean granted = flat != null && flat.contains(packageName);
            promise.resolve(granted);
        } catch (Exception e) {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void openNotificationAccessSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent intent = new Intent(Settings.ACTION_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                reactContext.startActivity(intent);
            } catch (Exception ignored) {}
        }
    }
}
`;

      fs.writeFileSync(
        path.join(javaDir, "RNNotificationListenerModule.java"),
        moduleCode
      );

      const packageCode = `package ${packageName};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class RNNotificationListenerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new RNNotificationListenerModule(reactContext));
        return modules;
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
`;

      fs.writeFileSync(
        path.join(javaDir, "RNNotificationListenerPackage.java"),
        packageCode
      );

      return config;
    },
  ]);
}

function withNotificationListenerPackageRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName =
        config.android?.package || "com.bildirimkaydedici";
      const packagePath = packageName.replace(/\./g, "/");
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        packagePath,
        "MainApplication.kt"
      );

      if (!fs.existsSync(mainAppPath)) {
        return config;
      }

      let content = fs.readFileSync(mainAppPath, "utf-8");

      if (!content.includes("RNNotificationListenerPackage")) {
        content = content.replace(
          "override fun getPackages(): List<ReactPackage> {",
          `override fun getPackages(): List<ReactPackage> {
      // Notification Listener Package added by plugin`
        );

        content = content.replace(
          "packages.add(new PackageList(this).packages)",
          `packages.add(new PackageList(this).packages);
          packages.add(new RNNotificationListenerPackage())`
        );

        content = content.replace(
          "PackageList(this).packages.toMutableList()",
          `PackageList(this).packages.toMutableList().also { list ->
            list.add(RNNotificationListenerPackage())
          }`
        );

        if (!content.includes("RNNotificationListenerPackage()")) {
          const addPackagesPattern = /val packages = PackageList\(this\)\.packages/;
          if (addPackagesPattern.test(content)) {
            content = content.replace(
              "val packages = PackageList(this).packages",
              `val packages = PackageList(this).packages
      packages.add(RNNotificationListenerPackage())`
            );
          }
        }

        fs.writeFileSync(mainAppPath, content);
      }

      return config;
    },
  ]);
}

module.exports = function withNotificationListener(config) {
  config = withNotificationListenerManifest(config);
  config = withNotificationListenerJava(config);
  config = withNotificationListenerPackageRegistration(config);
  return config;
};
