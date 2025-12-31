
import Foundation
import ChoicelyCore

enum ChoicelyRemoteBundle {
    private static let prefsProdVersionKey = "bundle_version_name"
    private static let bundlesSubdir = "rn/bundles"
    private static let bundleFileName = "main.jsbundle"
    private static let platform = "ios"

    private static let lock = NSLock()
    private static var lastToken: UInt64 = 0

    /// Returns the on-disk location for the cached production bundle.
    static func remoteBundleFileURL() -> URL {
        let fm = FileManager.default
        let base = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        return base
            .appendingPathComponent(bundlesSubdir, isDirectory: true)
            .appendingPathComponent(bundleFileName, isDirectory: false)
    }

    /// If a cached bundle exists and is non-empty, return it.
    static func preferredBundleURL() -> URL? {
        let url = remoteBundleFileURL()
        guard FileManager.default.isReadableFile(atPath: url.path) else { return nil }
        let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
        return size > 0 ? url : nil
    }

    /// Refreshes the cached production bundle if needed (Release-only).
    ///
    /// - Reads ChoicelyAppData.customData.full_version_name
    /// - If version differs (or file missing), downloads:
    ///   String(format: bundlesUrlFormat, appKey, platform, versionName, bundleFileName)
    static func refreshProductionBundleIfNeeded(
        appKey: String
    ) {
        guard
            let appData = ChoicelyDataManager.shared.getObject(
                ofType: ChoicelyAppData.self,
                forId: appKey
            )
        else { return }

        let dict = appData.customData?.parseAsJSONToDictionary()
        let versionNameRaw = dict?["full_version_name"] as? String
        let versionName = (versionNameRaw ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !versionName.isEmpty else { return }

        let dest = remoteBundleFileURL()

        let lastVersion = UserDefaults.standard.string(forKey: prefsProdVersionKey) ?? ""
        let destSize = (try? dest.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
        let destOk = FileManager.default.isReadableFile(atPath: dest.path) && destSize > 0

        if versionName == lastVersion, destOk {
            return
        }

        let bundlesUrlFormat = requireInfoPlistString("CHOICELY_RN_BUNDLES_URL")

        let bundleUrlString = String(format: bundlesUrlFormat, appKey, platform, versionName, bundleFileName)
        guard let bundleURL = URL(string: bundleUrlString) else {
            preconditionFailure("CHOICELY_RN_BUNDLES_URL produced invalid URL: \(bundleUrlString)")
        }

        let token = DispatchTime.now().uptimeNanoseconds
        setLastToken(token)

        let task = URLSession.shared.downloadTask(with: bundleURL) { tmpURL, response, error in
            if let error {
                _ = error
                return
            }
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                return
            }
            guard let tmpURL else {
                return
            }
            guard isLastToken(token) else {
                return
            }
            do {
                try FileManager.default.createDirectory(
                    at: dest.deletingLastPathComponent(),
                    withIntermediateDirectories: true
                )
                try excludeFromBackup(dest.deletingLastPathComponent())
                try replaceItem(at: dest, with: tmpURL)
                UserDefaults.standard.set(versionName, forKey: prefsProdVersionKey)
            } catch {
                _ = error
            }
        }
        task.resume()
    }

    private static func setLastToken(_ token: UInt64) {
        lock.lock()
        defer { lock.unlock() }
        lastToken = token
    }

    private static func isLastToken(_ token: UInt64) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        return lastToken == token
    }

    private static func requireInfoPlistString(_ key: String) -> String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: key) as? String else {
            preconditionFailure("Missing \(key) in Info.plist")
        }
        let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !s.isEmpty else {
            preconditionFailure("\(key) is empty in Info.plist")
        }
        return s
    }

    private static func replaceItem(at dest: URL, with src: URL) throws {
        let fm = FileManager.default
        if fm.fileExists(atPath: dest.path) {
            _ = try fm.replaceItemAt(dest, withItemAt: src, backupItemName: nil, options: [])
        } else {
            try fm.moveItem(at: src, to: dest)
        }
    }

    private static func excludeFromBackup(_ url: URL) throws {
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var mutable = url
        try mutable.setResourceValues(values)
    }
}
