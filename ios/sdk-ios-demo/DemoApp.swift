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
        ChoicelyRNBundleManager.refreshProductionBundleIfNeeded(appKey: ChoicelyConfig.choicelyAppKey)
    }

    var body: some Scene {
        WindowGroup {
            ChoicelySplashView()
        }
    }
}
