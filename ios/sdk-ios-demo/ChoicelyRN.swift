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

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
    
    @MainActor @preconcurrency override required dynamic init(nibName: String?, bundle: Bundle?) {
        fatalError("init(nibName:bundle:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()

        reactNativeFactoryDelegate = ReactNativeDelegate()
        reactNativeFactoryDelegate!.dependencyProvider = RCTAppDependencyProvider()

        reactNativeFactory = RCTReactNativeFactory(delegate: reactNativeFactoryDelegate!)

        // Preferred: create the root view with initial properties (mirrors Android launchOptions/Bundle)
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
      RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "src/index")
      #else
      Bundle.main.url(forResource: "main", withExtension: "jsbundle")
      #endif
    }
}

class TestViewController: UIViewController {

  var reactViewController: ReactViewController?

  override func viewDidLoad() {
    super.viewDidLoad()
    // Do any additional setup after loading the view.
    self.view.backgroundColor = .systemBackground

    let button = UIButton()
    button.setTitle("Open React Native", for: .normal)
    button.setTitleColor(.systemBlue, for: .normal)
    button.setTitleColor(.blue, for: .highlighted)
    button.addAction(UIAction { [weak self] _ in
      guard let self else { return }
      if reactViewController == nil {
       reactViewController = ReactViewController()
      }
      present(reactViewController!, animated: true)
    }, for: .touchUpInside)
    self.view.addSubview(button)

    button.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      button.leadingAnchor.constraint(equalTo: self.view.leadingAnchor),
      button.trailingAnchor.constraint(equalTo: self.view.trailingAnchor),
      button.centerXAnchor.constraint(equalTo: self.view.centerXAnchor),
      button.centerYAnchor.constraint(equalTo: self.view.centerYAnchor),
    ])
  }
}
