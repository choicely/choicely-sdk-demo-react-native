import SwiftUI
import ChoicelyCore

@main
struct DemoApp: App {
    init() {
        ChoicelySDK.settings.externalViewControllerFactory = CustomViewControllerFactory()
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
