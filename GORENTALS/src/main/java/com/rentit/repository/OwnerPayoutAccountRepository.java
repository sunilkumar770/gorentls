package com.rentit.repository;

import com.rentit.model.OwnerPayoutAccount;
import com.rentit.model.enums.PayoutOnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for owner bank/UPI payout accounts.
 *
 * One account per owner (enforced by DB UNIQUE constraint on owner_id).
 * PayoutEngine calls findVerifiedByOwnerId() — never the raw findByOwnerId().
 */
public interface OwnerPayoutAccountRepository extends JpaRepository<OwnerPayoutAccount, UUID> {

    /**
     * Fetch the payout account for a specific owner.
     * Returns empty if owner has never submitted account details.
     */
    Optional<OwnerPayoutAccount> findByOwnerId(UUID ownerId);

    /**
     * Existence check — used at owner onboarding to show
     * "Bank account connected" vs "Add your bank account" UI state.
     */
    boolean existsByOwnerId(UUID ownerId);

    /**
     * PayoutEngine safety check — fetch ONLY if the account is VERIFIED.
     * Returns empty if account exists but is PENDING / BLOCKED / SUSPENDED.
     *
     * Always use this query (not findByOwnerId) before scheduling a payout.
     */
    Optional<OwnerPayoutAccount> findByOwnerIdAndStatus(
        UUID ownerId, PayoutOnboardingStatus status
    );

    /**
     * Admin compliance view — list all accounts with a specific status.
     * e.g. findAllByStatus(BLOCKED) for fraud review queue.
     */
    List<OwnerPayoutAccount> findAllByStatus(PayoutOnboardingStatus status);

    /**
     * Lookup by RazorpayX fund account ID.
     * Used during penny-drop webhook reconciliation.
     */
    Optional<OwnerPayoutAccount> findByFundAccountId(String fundAccountId);
}
