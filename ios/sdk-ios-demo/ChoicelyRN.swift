import Foundation
import UIKit
import ChoicelyCore
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

enum DebugServerHost {
    static func normalizeFromCustomData(_ raw: String?) -> String? {
        guard let raw, !raw.isEmpty else { return nil }
        return normalize(raw)
    }

    static func normalize(_ input: String) -> String? {
        var s = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.isEmpty { return nil }
        if let hostPort = extractHostPort(s) {
            s = hostPort
        } else {
            s = s.replacingOccurrences(
                of: #"(?i)^https?://"#,
                with: "",
                options: .regularExpression
            )
        }
        while s.hasSuffix("/") {
            s.removeLast()
        }
        return s.isEmpty ? nil : s
    }

    private static func extractHostPort(_ s: String) -> String? {
        let hasScheme = s.lowercased().hasPrefix("http://") || s.lowercased().hasPrefix("https://")
        let candidate = hasScheme ? s : "http://\(s)"
        guard let url = URL(string: candidate) else { return nil }
        guard let host = url.host, !host.isEmpty else { return nil }
        if let port = url.port {
            if host.contains(":") && !host.hasPrefix("[") {
                return "[\(host)]:\(port)"
            }
            return "\(host):\(port)"
        }
        return host
    }
}

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
        let appData = ChoicelyDataManager.shared
            .getObject(ofType: ChoicelyAppData.self, forId: ChoicelyConfig.choicelyAppKey)
        let dict = appData?.customData?.parseAsJSONToDictionary()
        let bundleUrlMobile = dict?["bundle_url_mobile"] as? String
        provider.packagerScheme = "http"
        if let host = DebugServerHost.normalizeFromCustomData(bundleUrlMobile) {
            provider.jsLocation = "\(host):80"
        } else {
            provider.jsLocation = "localhost:\(metroPort())"
        }
        return provider.jsBundleURL(forBundleRoot: "src/index")
        #else
        ChoicelyRNBundleManager.refreshProductionBundleIfNeeded(appKey: ChoicelyConfig.choicelyAppKey)
        if let url = ChoicelyRNBundleManager.preferredBundleURL() {
            return url
        }
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
        #endif
    }

    private func metroPort() -> Int {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "RCT_METRO_PORT") as? String else {
            preconditionFailure("Missing RCT_METRO_PORT in Info.plist")
        }
        let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !s.isEmpty else {
            preconditionFailure("RCT_METRO_PORT is empty in Info.plist")
        }
        guard let p = Int(s) else {
            preconditionFailure("RCT_METRO_PORT is not a valid integer: '\(s)'")
        }
        return p
    }
}
