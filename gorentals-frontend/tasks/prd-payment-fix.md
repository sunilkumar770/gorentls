# PRD: Razorpay Checkout Stabilization

## Goal
Fix the checkout failure where the Razorpay modal doesn't open. Enable a "Mock Mode" for development.

## User Stories
- **US-001**: As a user, I want the payment button to initiate a simulated payment if the backend is in mock mode.
- **US-002**: As a developer, I want to see clear logs in the console when a payment is initiated.
- **US-003**: As a user, I want the payment button to reset its state if the modal is closed or an error occurs.

## Technical Tasks
- **TASK-001**: Detect `order_mock_` in `RazorpayCheckout.tsx`.
- **TASK-002**: Implement simulated success in `RazorpayCheckout.tsx`.
- **TASK-003**: Fix state management (isProcessing) in `RazorpayCheckout.tsx`.
- **TASK-004**: Synchronize keys in `.env` files.
