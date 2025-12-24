import UIKit
import Capacitor
import OSLog
import HealthKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var bootStartTime: Date?
    
    // ✅ BUILD 49: Logs estruturados com OSLog (aparecem no Xcode Organizer)
    let bootLogger = OSLog(subsystem: "com.atlontech.codsystem.app", category: "Boot")

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        bootStartTime = Date()
        
        // ✅ Registrar plugin HealthService para integração com Apple Health
        let bridge = (self.window?.rootViewController as? CAPBridgeViewController)?.bridge
        bridge?.registerPluginInstance(HealthServicePlugin())
        
        // ✅ BUILD 49: Usar OSLog para logs estruturados
        os_log(.info, log: bootLogger, "🚀 COD SYSTEM launching - Build 49")
        os_log(.info, log: bootLogger, "Bundle: %{public}@", Bundle.main.bundleIdentifier ?? "unknown")
        os_log(.info, log: bootLogger, "Version: %{public}@", Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown")
        os_log(.info, log: bootLogger, "Build: %{public}@", Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown")
        os_log(.info, log: bootLogger, "Device: %{public}@", UIDevice.current.name)
        os_log(.info, log: bootLogger, "iOS: %{public}@", UIDevice.current.systemVersion)
        os_log(.info, log: bootLogger, "Memory: %llu GB", ProcessInfo.processInfo.physicalMemory / 1_000_000_000)
        
        // ✅ BUILD 49: Timer aumentado (5s → 8s) para detectar boot lento
        DispatchQueue.main.asyncAfter(deadline: .now() + 8.0) { [weak self] in
            guard let start = self?.bootStartTime else { return }
            let elapsed = Date().timeIntervalSince(start)
            
            if elapsed > 8.0 {
                os_log(.error, log: self?.bootLogger ?? OSLog.default, "⚠️ Boot timeout: App took %.2f seconds to load", elapsed)
            }
        }
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        os_log(.info, log: bootLogger, "⏸️ App will resign active")
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        os_log(.info, log: bootLogger, "🔙 App entered background")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        os_log(.info, log: bootLogger, "🔜 App will enter foreground")
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        if let start = bootStartTime {
            let elapsed = Date().timeIntervalSince(start)
            os_log(.info, log: bootLogger, "✅ App became active after %.2f seconds", elapsed)
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        os_log(.info, log: bootLogger, "🔚 App terminating")
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
