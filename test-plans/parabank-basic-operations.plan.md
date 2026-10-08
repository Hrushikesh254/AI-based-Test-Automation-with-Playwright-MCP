# ParaBank Basic Operations Test Plan

## Application Overview

Functional test plan for ParaBank's basic customer workflows: registration and recovery, authentication, account setup and review, transfers, bill payments, transaction search, profile maintenance, and logout. Explored at https://parabank.parasoft.com/parabank/index.htm. Run only against an isolated ParaBank test/demo environment with synthetic data; never use real customer information or production banking accounts. Each test begins from a fresh browser context and uses its own uniquely generated synthetic customer unless preconditions say otherwise. Transactional scenarios must use disposable test accounts and verify balances and history before and after each operation.

## Test Scenarios

### 1. Registration and Access

**Seed:** `tests\seed.spec.ts`

#### 1.1. Register a new customer with valid synthetic details

**File:** `tests\parabank\registration.spec.ts`

**Steps:**
  1. From the ParaBank home page, select Register. Enter a unique username, matching password and confirmation, and valid synthetic values in every customer-information field; submit the form.
    - expect: The customer is created successfully and the site confirms the account was created.
    - expect: The new customer is authenticated and the account-services navigation is visible.
  2. Sign out, then sign in using the newly created username and password.
    - expect: Login succeeds and the authenticated account-services navigation is displayed.

#### 1.2. Reject incomplete or inconsistent registration data

**File:** `tests\parabank\registration-validation.spec.ts`

**Steps:**
  1. From a fresh state, open Register and submit the form with all fields blank.
    - expect: Registration is not completed; required-field validation or an explicit error is shown.
  2. Enter otherwise valid synthetic customer details, provide a password, enter a different confirmation password, and submit.
    - expect: The mismatch is identified and no account is created.
  3. Submit using a username already assigned to a different test customer.
    - expect: The duplicate username is rejected with a clear error and the existing account is not changed.

#### 1.3. Handle invalid login and recover login information

**File:** `tests\parabank\authentication-recovery.spec.ts`

**Steps:**
  1. On the home page, submit login with an unknown username and incorrect password.
    - expect: Authentication is denied and a clear error is displayed; authenticated account navigation is not shown.
  2. Select Forgot login info, submit the lookup form with invalid synthetic customer details, and review the result.
    - expect: The lookup does not disclose another customer's credentials and displays an appropriate not-found or validation result.
  3. For a test customer created specifically for this scenario, submit the exact matching identity details through Customer Lookup.
    - expect: The lookup returns only the matching account's login information according to the application's behavior.

#### 1.4. Log out and prevent continued access to authenticated pages

**File:** `tests\parabank\logout.spec.ts`

**Steps:**
  1. Sign in as a fresh test customer and select Log Out.
    - expect: The customer is logged out and returned to a public/login page.
  2. Use browser back navigation or directly visit Accounts Overview without signing in again.
    - expect: Authenticated account data is not accessible; the user is redirected to login or shown an unauthenticated response.

### 2. Account Management

**Seed:** `tests\seed.spec.ts`

#### 2.1. Open checking and savings accounts

**File:** `tests\parabank\open-account.spec.ts`

**Steps:**
  1. Register and sign in as a fresh test customer. Open Accounts Overview and record the initial account number and balance.
    - expect: The initial account is listed with account number, balance, and available amount.
  2. Open New Account, select CHECKING, choose the existing account as the funding source, and submit.
    - expect: A new checking account is created successfully and its account number is shown.
    - expect: The new account is listed in Accounts Overview and the funding debit/new-account credit follow the displayed minimum deposit rule (currently $100).
  3. Repeat using SAVINGS as the account type, selecting an available funding account.
    - expect: A new savings account is created and appears in the overview with the correct account type.

#### 2.2. Review account balances and filter account activity

**File:** `tests\parabank\accounts-overview-activity.spec.ts`

**Steps:**
  1. Sign in as a test customer with at least one account and open Accounts Overview.
    - expect: Each account number is linked to its details, the account type balance values are visible, and the total is consistent with the listed balances.
  2. Open an account from the overview and verify its account number, type, balance, and available amount.
    - expect: Account details match the selected account and the activity controls are available.
  3. Run account activity with period All and transaction type All, then filter by a month and by Credit and Debit separately.
    - expect: Each filter returns only matching transactions, or a clear no-transactions message when there are none.

### 3. Payments and Transaction Search

**Seed:** `tests\seed.spec.ts`

#### 3.1. Transfer funds between customer accounts

**File:** `tests\parabank\transfer-funds.spec.ts`

**Steps:**
  1. Sign in with at least two funded accounts. Record both balances, then transfer a valid positive amount from the source account to the destination account.
    - expect: A transfer confirmation is displayed.
    - expect: Source balance decreases and destination balance increases by the transfer amount; account activity records the debit and credit.
  2. Attempt a transfer with a blank, zero, negative, non-numeric, or over-balance amount, and attempt selecting the same account as both source and destination if the UI permits it.
    - expect: Invalid transfers are rejected or safely handled with clear feedback; no unintended balance changes occur.

#### 3.2. Pay a bill and validate payee and payment inputs

**File:** `tests\parabank\bill-pay.spec.ts`

**Steps:**
  1. Sign in as a test customer with a funded account. On Bill Pay, enter valid synthetic payee contact details, matching account and verify-account numbers, a valid amount, and a funding account; send the payment.
    - expect: A payment confirmation is shown with the payee and amount.
    - expect: The selected account is debited by the payment amount and the payment is recorded in account activity/search.
  2. Submit with missing payee details, mismatching account numbers, a blank/zero/negative/nonnumeric amount, or an amount greater than the available balance.
    - expect: Invalid payment details are rejected with validation feedback and no unintended debit or payment record is created.

#### 3.3. Find transactions using each available search criterion

**File:** `tests\parabank\transaction-search.spec.ts`

**Steps:**
  1. Sign in with a test customer whose account has known transactions. Open Find Transactions and search using a known transaction ID.
    - expect: The matching transaction is returned for the selected account.
  2. Search by a transaction date, by a valid date range, and by an exact amount.
    - expect: Each search shows only matching transactions; results remain associated with the selected account.
  3. Search with an unknown transaction ID, invalid date, reversed date range, and amount with no matching transaction.
    - expect: Invalid criteria are clearly rejected or produce no results; no unrelated transaction is shown.

### 4. Customer Profile

**Seed:** `tests\seed.spec.ts`

#### 4.1. Update and validate customer contact information

**File:** `tests\parabank\update-profile.spec.ts`

**Steps:**
  1. Sign in as a fresh test customer and open Update Contact Info. Change one or more contact fields to valid synthetic values and submit.
    - expect: The update succeeds with a confirmation.
    - expect: Reopening Update Contact Info shows the saved values.
  2. Try submitting with required contact fields blank or invalidly formatted where the UI validates them.
    - expect: The invalid update is rejected or clearly flagged and valid saved profile data is not silently lost.
