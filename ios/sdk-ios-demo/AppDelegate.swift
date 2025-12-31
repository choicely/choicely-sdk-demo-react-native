import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate {
    @objc var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        DispatchQueue.main.async {
            self.window = UIApplication.shared._keyWindow
        }
        return true
    }
}

private extension UIApplication {
    var _keyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
    }
}
