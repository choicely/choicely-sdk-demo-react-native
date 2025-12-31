import Foundation

enum ChoicelyConfig {
    static var choicelyAppKey: String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "CHOICELY_APP_KEY") as? String else {
            preconditionFailure("Missing CHOICELY_APP_KEY in Info.plist")
        }

        let key = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !key.isEmpty else {
            preconditionFailure("CHOICELY_APP_KEY is empty in Info.plist")
        }

        return key
    }
}
