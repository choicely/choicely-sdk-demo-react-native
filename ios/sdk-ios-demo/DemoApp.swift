import SwiftUI
import ChoicelyCore

@main
struct DemoApp: App {
    init() {
        ChoicelySDK.settings.externalViewControllerFactory = CustomViewControllerFactory()
        ChoicelySDK.initialize(
            application: UIApplication.shared,
            appKey: "Y2hvaWNlbHktZXUvYXBwcy9mY3Zud1hpUGVDemFFcGNVSzBreA"
        )
    }

    var body: some Scene {
        WindowGroup {
            ChoicelySplashView()
        }
    }
}
