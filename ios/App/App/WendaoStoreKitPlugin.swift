import Capacitor
import StoreKit
import UIKit

@objc(WendaoStoreKitPlugin)
public class WendaoStoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WendaoStoreKitPlugin"
    public let jsName = "WendaoStoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manage", returnType: CAPPluginReturnPromise),
    ]

    private let productIdentifiers = [
        "com.yonge6.wendao.companion.monthly",
        "com.yonge6.wendao.companion.annual",
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
}

final class WendaoBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WendaoStoreKitPlugin())
    }
}
