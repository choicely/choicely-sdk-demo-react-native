import SwiftUI
import ChoicelyCore

@main
struct DemoApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    init() {
        ChoicelySDK.settings.externalViewControllerFactory = MyContentFactory()
        ChoicelySDK.initialize(
            application: UIApplication.shared,
            appKey: ChoicelyConfig.choicelyAppKey
        )
        #if !DEBUG
        ChoicelyRemoteBundle.refreshProductionBundleIfNeeded(appKey: ChoicelyConfig.choicelyAppKey)
        #endif
    }

    var body: some Scene {
        WindowGroup {
            ChoicelySplashView()
        }
    }
}
