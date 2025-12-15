import UIKit
import ChoicelyCore
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

final class ReactViewController: ChoicelyViewController {
    private var reactNativeFactory: RCTReactNativeFactory?
    private var reactNativeFactoryDelegate: RCTReactNativeFactoryDelegate?

    private let moduleName: String
    private let initialProps: NSDictionary?

    init(moduleName: String, initialProps: NSDictionary? = nil) {
        self.moduleName = moduleName
        self.initialProps = initialProps
        super.init(nibName: nil, bundle: nil)
    }

    required init ? (coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    @MainActor @preconcurrency required dynamic init(nibName: String?, bundle: Bundle?) {
        fatalError("init(nibName:bundle:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        reactNativeFactoryDelegate = ReactNativeDelegate()
        reactNativeFactoryDelegate!.dependencyProvider = RCTAppDependencyProvider()
        reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)
        view = reactNativeFactory!.rootViewFactory.view(
            withModuleName: moduleName,
            initialProperties: initialProps as? [AnyHashable: Any],
            launchOptions: nil
        )
    }
}

final class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        let provider = RCTBundleURLProvider.sharedSettings()
        provider.jsLocation = "localhost:8932"
        return provider.jsBundleURL(forBundleRoot: "src/index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
}
