'use client';

import Link from 'next/link';

/**
 * UpgradeOwnerCard
 *
 * Shown on /create-listing when the logged-in user has role RENTER.
 * The /api/users/upgrade endpoint does not exist — owner accounts
 * are created only via /signup with userType OWNER.
 * This card informs the user and links them to register an owner account.
 */
export default function UpgradeOwnerCard() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">

        {/* Icon */}
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🏪</span>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Owner account required
        </h2>

        {/* Body */}
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Listing items on GoRentals requires an Owner account.
          Your current account is a Renter account and cannot be upgraded.
          Please register a separate Owner account to start listing.
        </p>

        {/* Primary CTA */}
        <Link
          href="/signup"
          className="block w-full bg-gray-900 hover:bg-gray-700 text-white
                     font-semibold text-sm py-3 px-6 rounded-xl
                     transition-colors text-center"
        >
          Register as Owner
        </Link>

        {/* Secondary — go back */}
        <Link
          href="/"
          className="block mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to home
        </Link>

      </div>
    </div>
  );
}
