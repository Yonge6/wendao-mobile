import AuthenticationServices
import Capacitor
import CryptoKit
import Photos
import Security
import StoreKit
import UIKit

@objc(WendaoStoreKitPlugin)
public class WendaoStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WendaoStoreKitPlugin"
    public let jsName = "WendaoStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "entitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "review", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveImageToPhotos", returnType: CAPPluginReturnPromise),
    ]

    private let productIdentifiers = [
        "com.yonge6.wendao.companion.monthly",
        "com.yonge6.wendao.companion.annual",
        "com.yonge6.wendao.reading.lifetime",
    ]

    @objc func products(_ call: CAPPluginCall) {
        Task {
            do {
                let products = try await Product.products(for: productIdentifiers)
                let values = products.sorted { $0.id < $1.id }.map { product in
                    [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice,
                    ]
                }
                call.resolve(["products": values])
            } catch {
                call.reject("App Store products are temporarily unavailable", "STORE_PRODUCTS_UNAVAILABLE")
            }
        }
    }

    @objc func entitlements(_ call: CAPPluginCall) {
        Task {
            var values: [[String: String]] = []
            for await result in Transaction.currentEntitlements {
                guard case .verified(let transaction) = result,
                      productIdentifiers.contains(transaction.productID) else { continue }
                var value = ["productId": transaction.productID]
                if let expirationDate = transaction.expirationDate {
                    value["expiresAt"] = ISO8601DateFormatter().string(from: expirationDate)
                }
                values.append(value)
            }
            call.resolve(["entitlements": values])
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), productIdentifiers.contains(productId) else {
            call.reject("Unknown product", "INVALID_PRODUCT")
            return
        }
        guard let tokenValue = call.getString("appAccountToken"), let token = UUID(uuidString: tokenValue) else {
            call.reject("Invalid account token", "INVALID_ACCOUNT_TOKEN")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product unavailable", "STORE_PRODUCT_UNAVAILABLE")
                    return
                }
                switch try await product.purchase(options: [.appAccountToken(token)]) {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        call.resolve([
                            "status": "purchased",
                            "transactionId": String(transaction.id),
                            "signedTransaction": verification.jwsRepresentation,
                        ])
                    case .unverified:
                        call.reject("Transaction verification failed", "UNVERIFIED_TRANSACTION")
                    }
                case .pending:
                    call.resolve(["status": "pending"])
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                @unknown default:
                    call.reject("Unknown purchase result", "UNKNOWN_PURCHASE_RESULT")
                }
            } catch {
                call.reject("Purchase could not be completed", "PURCHASE_FAILED")
            }
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var transactions: [[String: String]] = []
                for await result in Transaction.currentEntitlements {
                    guard case .verified(let transaction) = result,
                          productIdentifiers.contains(transaction.productID) else { continue }
                    transactions.append([
                        "transactionId": String(transaction.id),
                        "productId": transaction.productID,
                        "signedTransaction": result.jwsRepresentation,
                    ])
                }
                call.resolve(["transactions": transactions])
            } catch {
                call.reject("Purchases could not be restored", "RESTORE_FAILED")
            }
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let transactionId = call.getString("transactionId") else {
            call.reject("Missing transaction", "INVALID_TRANSACTION")
            return
        }
        Task {
            for await result in Transaction.unfinished {
                guard case .verified(let transaction) = result else { continue }
                if String(transaction.id) == transactionId {
                    await transaction.finish()
                    call.resolve(["finished": true])
                    return
                }
            }
            call.resolve(["finished": false])
        }
    }

    @objc func manage(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive }) else {
                call.reject("No active window", "NO_ACTIVE_WINDOW")
                return
            }
            do {
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve()
            } catch {
                call.reject("Subscriptions could not be opened", "MANAGE_SUBSCRIPTION_FAILED")
            }
        }
    }

    @objc func review(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let url = URL(string: "itms-apps://itunes.apple.com/app/id6796945428?action=write-review") else {
                call.reject("App Store review page is unavailable", "REVIEW_URL_UNAVAILABLE")
                return
            }
            UIApplication.shared.open(url, options: [:]) { opened in
                if opened {
                    call.resolve()
                } else {
                    call.reject("App Store review page could not be opened", "REVIEW_OPEN_FAILED")
                }
            }
        }
    }

    @objc func saveImageToPhotos(_ call: CAPPluginCall) {
        guard let base64 = call.getString("data"),
              let imageData = Data(base64Encoded: base64),
              let image = UIImage(data: imageData) else {
            call.reject("Image data is invalid", "INVALID_IMAGE_DATA")
            return
        }

        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                call.reject("Photos access was not granted", "PHOTOS_PERMISSION_DENIED")
                return
            }
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { saved, error in
                if saved {
                    call.resolve(["saved": true])
                } else {
                    call.reject(error?.localizedDescription ?? "Image could not be saved", "PHOTO_SAVE_FAILED")
                }
            }
        }
    }
}

@objc(WendaoAppleSignInPlugin)
public final class WendaoAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    public let identifier = "WendaoAppleSignInPlugin"
    public let jsName = "WendaoAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?
    private var rawNonce: String?

    @objc func signIn(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.pendingCall == nil else {
                call.reject("Apple sign in is already open", "APPLE_SIGN_IN_IN_PROGRESS")
                return
            }
            guard let nonce = self.makeNonce() else {
                call.reject("Apple sign in could not start", "APPLE_NONCE_FAILED")
                return
            }

            self.pendingCall = call
            self.rawNonce = nonce
            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName, .email]
            request.nonce = self.sha256(nonce)
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = bridge?.viewController?.view.window { return window }
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = pendingCall,
              let nonce = rawNonce,
              let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            finishWithError(message: "Apple did not return an identity token", code: "APPLE_ID_TOKEN_MISSING")
            return
        }

        var result: [String: String] = ["identityToken": identityToken, "nonce": nonce]
        if let givenName = credential.fullName?.givenName, !givenName.isEmpty { result["givenName"] = givenName }
        if let familyName = credential.fullName?.familyName, !familyName.isEmpty { result["familyName"] = familyName }
        pendingCall = nil
        rawNonce = nil
        call.resolve(result)
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        if let authorizationError = error as? ASAuthorizationError, authorizationError.code == .canceled {
            finishWithError(message: "APPLE_SIGN_IN_CANCELLED", code: "APPLE_SIGN_IN_CANCELLED")
        } else {
            finishWithError(message: "Apple sign in could not be completed", code: "APPLE_SIGN_IN_FAILED")
        }
    }

    private func finishWithError(message: String, code: String) {
        let call = pendingCall
        pendingCall = nil
        rawNonce = nil
        call?.reject(message, code)
    }

    private func makeNonce(length: Int = 32) -> String? {
        let characters = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var bytes = [UInt8](repeating: 0, count: length)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { return nil }
        return String(bytes.map { characters[Int($0) % characters.count] })
    }

    private func sha256(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

final class WendaoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WendaoStoreKitPlugin())
        bridge?.registerPluginInstance(WendaoAppleSignInPlugin())
    }
}
