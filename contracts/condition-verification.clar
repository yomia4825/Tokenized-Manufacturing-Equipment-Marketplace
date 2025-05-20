;; Condition Verification Contract
;; Validates equipment status

(define-data-var admin principal tx-sender)

;; Map to store condition verifiers
(define-map authorized-verifiers principal bool)

;; Map to store equipment condition reports
(define-map condition-reports { equipment-id: uint, report-id: uint }
  {
    verifier: principal,
    condition-rating: uint,  ;; 1-10 scale
    inspection-date: uint,
    notes: (string-utf8 1000),
    maintenance-history: (string-utf8 1000),
    images-hash: (buff 32)  ;; Hash of images stored off-chain
  }
)

;; Counter for report IDs
(define-data-var report-id-counter uint u0)

;; Function to add authorized verifiers
(define-public (add-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-set authorized-verifiers verifier true))
  )
)

;; Function to remove verifiers
(define-public (remove-verifier (verifier principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u100))
    (ok (map-delete authorized-verifiers verifier))
  )
)

;; Function to submit condition report
(define-public (submit-condition-report
    (equipment-id uint)
    (condition-rating uint)
    (notes (string-utf8 1000))
    (maintenance-history (string-utf8 1000))
    (images-hash (buff 32))
  )
  (let
    (
      (is-verifier (default-to false (map-get? authorized-verifiers tx-sender)))
      (new-report-id (+ (var-get report-id-counter) u1))
    )
    (asserts! is-verifier (err u400))
    (asserts! (<= condition-rating u10) (err u401))
    (map-set condition-reports { equipment-id: equipment-id, report-id: new-report-id }
      {
        verifier: tx-sender,
        condition-rating: condition-rating,
        inspection-date: block-height,
        notes: notes,
        maintenance-history: maintenance-history,
        images-hash: images-hash
      }
    )
    (var-set report-id-counter new-report-id)
    (ok new-report-id)
  )
)

;; Read-only function to get condition report
(define-read-only (get-condition-report (equipment-id uint) (report-id uint))
  (map-get? condition-reports { equipment-id: equipment-id, report-id: report-id })
)

;; Read-only function to check if address is an authorized verifier
(define-read-only (is-authorized-verifier (address principal))
  (default-to false (map-get? authorized-verifiers address))
)

;; Function to get the latest report ID for an equipment
(define-read-only (get-latest-report-id)
  (var-get report-id-counter)
)
