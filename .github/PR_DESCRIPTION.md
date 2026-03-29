# Add Conversion Receipt Testing and Documentation

Closes Shelterflex/monorepo#257

## Summary

This PR adds comprehensive integration tests and documentation for the existing conversion receipt recording system. The conversion receipt functionality is already fully implemented across the service layer, outbox pattern, Soroban adapter, and smart contract. This work validates the complete flow and documents how all layers work together.

## Changes

### 1. TestSorobanAdapter (`backend/src/soroban/test-adapter.ts`)
- Extends `StubSorobanAdapter` with test-specific capabilities
- Tracks all `recordReceipt()` calls for verification
- Simulates transient failures and duplicate receipt errors
- Handles duplicate errors as idempotent success (matching production behavior)
- Provides inspection methods and `reset()` for test cleanup

### 2. Integration Tests (`backend/src/services/conversionReceipt.integration.test.ts`)
Implements 6 property-based integration tests validating:

- **Property 1**: End-to-end conversion receipt flow with metadata propagation
- **Property 2**: Service-layer idempotency (multiple `convertDeposit` calls)
- **Property 3**: Outbox-layer duplicate prevention
- **Property 4**: Adapter-layer idempotency handling
- **Property 5**: Retry with exponential backoff
- **Property 6**: Staking conversion synthetic depositId format

**Test Infrastructure:**
- Real `ConversionService`, `OutboxSender`, and `outboxStore`
- `TestSorobanAdapter` for simulating Soroban interactions
- Database cleanup hooks for test isolation
- Helper functions for common test operations

### 3. Documentation (`docs/conversion-receipts.md`)
Complete documentation covering:

- **Overview**: Purpose and key features of conversion receipts
- **Architecture**: Flow diagram and component descriptions
- **End-to-End Flow**: Step-by-step walkthrough with code examples
- **Idempotency Guarantees**: Four-layer idempotency (service, outbox, adapter, contract)
- **Metadata Fields**: Detailed descriptions of `amountNgn`, `fxRate`, `fxProvider`
- **Verification Guide**: Instructions for operators and developers
- **Troubleshooting**: 6 common issues with detailed solutions
- **Code Examples**: 7 practical examples for common operations

## Testing

All integration tests pass successfully:

```bash
✓ Property 1: End-to-end conversion receipt flow
✓ Property 2: Service-layer idempotency
✓ Property 3: Outbox-layer duplicate prevention
✓ Property 4: Adapter-layer idempotency handling
✓ Property 5: Retry with exponential backoff
✓ Property 6: Staking conversion synthetic depositId
```

Run tests with:
```bash
cd backend
npm test conversionReceipt.integration.test.ts
```

## Backend Checks

- [x] `npm run lint` - Passes
- [x] `npm run typecheck` - Passes
- [x] `npm run build` - Passes

## Key Features Validated

### Four-Layer Idempotency
1. **Service Layer**: Checks for existing conversions before creating new ones
2. **Outbox Layer**: Database unique constraint on `(source, ref)`
3. **Adapter Layer**: Treats duplicate receipt errors as idempotent success
4. **Contract Layer**: Rejects duplicate `tx_id` values

### Metadata Propagation
- `amountNgn`: Source amount in Nigerian Naira
- `fxRate`: Exchange rate (NGN per USDC)
- `fxProvider`: Provider identifier (`onramp`, `offramp`, `manual_admin`)

### Error Recovery
- Automatic retry with exponential backoff (2^n * 1000ms)
- Max retry limit of 10 attempts
- Graceful handling of transient failures

## Documentation Highlights

The documentation provides:
- Clear architecture diagrams showing the complete flow
- Operator guidance for verifying receipts were recorded
- Developer guidance for testing receipt recording
- Troubleshooting guide with 6 common issues and solutions
- 7 practical code examples

## Impact

- ✅ No changes to existing production code
- ✅ Adds comprehensive test coverage for conversion receipts
- ✅ Provides operator and developer documentation
- ✅ Validates all correctness properties of the system
- ✅ Enables confident troubleshooting and monitoring

## Definition of Done (Backend Feature)

- [x] Tests added and passing (6 property-based integration tests)
- [x] Documentation complete (`docs/conversion-receipts.md`)
- [x] No breaking changes to existing endpoints
- [x] Error handling validated through integration tests
- [x] Clear separation of concerns (test infrastructure in `test-adapter.ts`)
- [x] Logging validated through test adapter tracking

## Checklist

- [x] Tests added and passing
- [x] Documentation complete
- [x] No breaking changes
- [x] Follows existing code style
- [x] Atomic commits with clear messages
- [x] Backend checks pass (lint, typecheck, build)
- [x] PR scoped to backend area only
