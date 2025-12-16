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
        edgesForExtendedLayout = []
        extendedLayoutIncludesOpaqueBars = false

        reactNativeFactoryDelegate = ReactNativeDelegate()
        reactNativeFactoryDelegate!.dependencyProvider = RCTAppDependencyProvider()
        reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)

        let rnView = reactNativeFactory!.rootViewFactory.view(
          withModuleName: moduleName,
          initialProperties: initialProps as? [AnyHashable: Any],
          launchOptions: nil
        )
        rnView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(rnView)
        
        NSLayoutConstraint.activate([
          rnView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
          rnView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
          rnView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
          rnView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])
    }
}

final class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        let provider = RCTBundleURLProvider.sharedSettings()
        let port = metroPort()
        provider.jsLocation = "localhost:\(port)"
        return provider.jsBundleURL(forBundleRoot: "src/index")
        #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }
    
    private func metroPort() -> Int {
      if let s = Bundle.main.object(forInfoDictionaryKey: "RCT_METRO_PORT") as? String,
         let p = Int(s) { return p }
      if let s = ProcessInfo.processInfo.environment["RCT_METRO_PORT"],
         let p = Int(s) { return p }
      return 8932
    }
}
