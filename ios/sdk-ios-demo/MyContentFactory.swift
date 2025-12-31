import Foundation
import ChoicelyCore

final class MyContentFactory: ChoicelyExternalViewControllerFactory {

    func createViewController(choicelyNavigationitem: ChoicelyNavigationItem?) -> ChoicelyController? {
        guard let internalUrl = choicelyNavigationitem?.internalUrl,
              !internalUrl.isEmpty
        else { return nil }
        guard let comps = URLComponents(string: internalUrl) else {
            return nil
        }
        guard comps.host == "special" else {
            return nil
        }
        let segments = comps.path.split(separator: "/").map(String.init)
        guard segments.count >= 2 else {
            return nil
        }
        let specialKey = segments[0]
        guard specialKey == "rn" else {
            return nil
        }
        let rnComponentName = segments[1]
        guard !rnComponentName.isEmpty else {
            return nil
        }
        var props: [String: Any] = [:]
        if let items = comps.queryItems {
            for item in items {
                guard !item.name.isEmpty else {
                    continue
                }
                if let value = item.value {
                    props[item.name] = value
                }
            }
        }
        return ReactViewController(
            moduleName: rnComponentName,
            initialProps: props as NSDictionary
        )
    }
}
