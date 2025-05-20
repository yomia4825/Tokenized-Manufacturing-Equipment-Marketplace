;; Seller Verification Contract
;; Validates equipment owners in the marketplace

(define-data-var admin principal tx-sender)

;; Map to store verified sellers
(define-map verified-sellers principal
  {
    is-verified: bool,
    verification-date: uint,
    company-name: (string-ascii 100),
    contact-info: (string-ascii 100)
  }
)

;; Public function to verify a seller (only admin can call)
(define-public (verify-seller
    (seller principal)
    (company-name (string-ascii 100))
    (contact-info (string-ascii 100))
  )
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set verified-sellers seller {
      is-verified: true,
      verification-date: block-height,
      company-name: company-name,
      contact-info: contact-info
    }))
  )
)

;; Public function to revoke seller verification
(define-public (revoke-verification (seller principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-delete verified-sellers seller))
  )
)

;; Read-only function to check if a seller is verified
(define-read-only (is-seller-verified (seller principal))
  (default-to false (get is-verified (map-get? verified-sellers seller)))
)

;; Read-only function to get seller details
(define-read-only (get-seller-details (seller principal))
  (map-get? verified-sellers seller)
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (var-set admin new-admin))
  )
)
