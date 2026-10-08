# Sauce Demo Full Application Test Plan

## Application Overview

Comprehensive functional, validation, navigation, and regression coverage for the Sauce Demo (Swag Labs) shopping application, from sign-in through catalog, cart, checkout, order completion, menu actions, and account-profile variations.

## Test Scenarios

### 1. Authentication and session management

**Seed:** `tests/seed.spec.ts`

#### 1.1. Sign in with each documented user profile

**File:** `tests/authentication/valid-login.spec.ts`

**Steps:**
  1. Starting from a fresh browser context at https://www.saucedemo.com/, review the usernames displayed on the login page and use secret_sauce with standard_user.
    - expect: The user is authenticated and redirected to the Products inventory page.
    - expect: The product catalog loads and the cart badge is empty.
  2. Log out using the navigation menu, then repeat sign-in with problem_user, performance_glitch_user, error_user, and visual_user; run locked_out_user separately as a negative case.
    - expect: Each non-locked-out documented profile reaches the application; record profile-specific rendering, timing, or interaction differences without treating documented demo-account quirks as generic failures.
    - expect: locked_out_user remains on login and receives a clear locked-out error.
    - expect: No profile exposes another user's prior cart or session state.

#### 1.2. Reject missing and invalid credentials

**File:** `tests/authentication/login-validation.spec.ts`

**Steps:**
  1. On the fresh login page, submit with both fields empty, then test username-only, password-only, and an unknown username/password combination.
    - expect: Submission is blocked for missing fields and invalid credentials.
    - expect: An actionable error is shown, credentials are not accepted, and the user remains on the login page.
    - expect: Dismissible error controls clear the visible error without unexpectedly authenticating.

#### 1.3. Log out and protect authenticated pages

**File:** `tests/authentication/logout-protected-routes.spec.ts`

**Steps:**
  1. Sign in, add an item to the cart, open the menu, and select Logout.
    - expect: The user returns to the login page and the authenticated inventory is no longer displayed.
  2. Use browser Back and directly revisit an authenticated URL such as /inventory.html or /cart.html after logout.
    - expect: Protected content is not accessible while logged out; the app redirects to login or otherwise enforces authentication.

### 2. Catalog and navigation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Verify inventory contents and all sort orders

**File:** `tests/catalog/inventory-and-sorting.spec.ts`

**Steps:**
  1. Sign in as standard_user and record the six inventory products, names, images, descriptions, and prices.
    - expect: All six products have matching title, product image, description, and price; every item has an Add to cart action.
  2. Select each available sort option: Name (A to Z), Name (Z to A), Price (low to high), and Price (high to low).
    - expect: The displayed order matches the selected sort, including correct ascending/descending price handling and deterministic order for equal prices.
    - expect: Changing sorting does not alter product details or the cart.

#### 2.2. Open and return from product detail pages

**File:** `tests/catalog/product-details.spec.ts`

**Steps:**
  1. From inventory, open each product using both its image and title where available.
    - expect: The details page identifies the same product and displays its matching image, description, and price.
  2. Use Back to products, then navigate to another product and use browser Back.
    - expect: Both navigation paths return to the expected inventory or product detail, without losing a valid cart state.

#### 2.3. Add and remove products from inventory and product detail

**File:** `tests/catalog/cart-actions.spec.ts`

**Steps:**
  1. Add one product from the inventory, then add a different product from its detail page.
    - expect: The cart badge reflects the number of selected products.
    - expect: Each selected product's action changes to Remove and the state is consistent between inventory, detail, and cart views.
  2. Remove one item from inventory and the other from its detail page.
    - expect: The cart badge and product actions update immediately and remain synchronized.
    - expect: Removing all items returns the cart to its empty state.

#### 2.4. Verify application menu and footer navigation

**File:** `tests/navigation/menu-and-footer.spec.ts`

**Steps:**
  1. Open and close the navigation menu from inventory and a product detail page; select All Items and Dynamic Catalog.
    - expect: Menu opens and closes reliably; All Items returns to the inventory and Dynamic Catalog responds consistently without unintended cart changes.
  2. Select About and verify it opens the Sauce Labs destination; inspect the X, Facebook, and LinkedIn footer links.
    - expect: External links point to their expected destinations and do not corrupt the current application session.

#### 2.5. Reset application state from menu

**File:** `tests/navigation/reset-app-state.spec.ts`

**Steps:**
  1. Add multiple products, open the menu, and select Reset App State.
    - expect: Cart state and badges are cleared and product actions return to Add to cart.
    - expect: The user remains on an appropriate authenticated page with the menu usable.
  2. Repeat reset from a non-empty cart and from another authenticated page, then verify inventory/cart consistency.
    - expect: Reset behavior is consistent across supported views and leaves no stale cart state.

### 3. Cart and checkout

**Seed:** `tests/seed.spec.ts`

#### 3.1. Verify empty cart and continue-shopping navigation

**File:** `tests/cart/empty-cart.spec.ts`

**Steps:**
  1. Sign in with a fresh state and open the cart without adding products.
    - expect: The cart is empty, the badge is absent or indicates zero, and no item rows are shown.
  2. Select Continue Shopping.
    - expect: The user returns to inventory and the cart remains empty.

#### 3.2. Review cart contents and remove items

**File:** `tests/cart/cart-review.spec.ts`

**Steps:**
  1. Add several distinct products, open the cart, and compare each row with its inventory data.
    - expect: Cart quantity, product name, description, and price match the selected products; no unselected products appear.
  2. Remove one item, continue shopping, and return to the cart; then remove all remaining items.
    - expect: Each removal updates the cart rows and badge without changing unrelated items.
    - expect: Checkout is usable only in accordance with the application's empty-cart behavior; document any unexpected ability to proceed with no items.

#### 3.3. Validate required checkout information

**File:** `tests/checkout/required-information-validation.spec.ts`

**Steps:**
  1. Add a product, open the cart, select Checkout, and submit the information form with all fields blank.
    - expect: The form stays on Checkout: Your Information and identifies First Name as required.
  2. Enter only a first name and submit; then enter a last name while leaving postal code blank and submit.
    - expect: The form identifies the next missing required field in order (Last Name, then Zip/Postal Code) and does not advance.
  3. Fill all three fields with ordinary valid values and continue.
    - expect: The user advances to Checkout: Overview and the selected cart item is retained.

#### 3.4. Cancel checkout without losing cart contents

**File:** `tests/checkout/cancel-and-preserve-cart.spec.ts`

**Steps:**
  1. Add two products and begin checkout; select Cancel on the information step.
    - expect: The user returns to the cart and both items remain.
  2. Re-enter checkout with valid information and select Cancel on the overview step.
    - expect: The user returns to inventory; cart contents remain unless explicitly cleared by the app's defined behavior.

#### 3.5. Verify order summary, tax, and total calculations

**File:** `tests/checkout/order-summary.spec.ts`

**Steps:**
  1. Add one product, enter valid customer information, and continue to Checkout: Overview.
    - expect: Summary contains the correct item list, payment and shipping information, item subtotal, tax, and total.
    - expect: Tax and total calculations are mathematically correct to two decimal places; total equals subtotal plus tax.
  2. Repeat with multiple products at varied prices and verify quantity/list consistency.
    - expect: Subtotal is the sum of item prices and tax/total are recalculated consistently.

#### 3.6. Complete an order and verify confirmation actions

**File:** `tests/checkout/complete-order.spec.ts`

**Steps:**
  1. From an overview with at least one item, select Finish.
    - expect: Checkout: Complete! appears with a success message and delivery confirmation; the cart is empty.
  2. Select Back Home and verify inventory; repeat a completed purchase and use Generate PDF order.
    - expect: Back Home returns to inventory with cleared purchase state.
    - expect: Generate PDF order produces a usable PDF/download containing the order confirmation and does not break navigation.

### 4. Profile variations, resilience, and usability

**Seed:** `tests/seed.spec.ts`

#### 4.1. Exercise catalog and purchase flow across user profiles

**File:** `tests/profiles/account-behavior-regression.spec.ts`

**Steps:**
  1. In independent fresh contexts, sign in using each accepted documented profile other than locked_out_user and exercise inventory, sorting, product details, add/remove, and a representative checkout.
    - expect: Each account can complete its expected application journey or displays its documented profile-specific behavior.
    - expect: Capture defects in product images, ordering, responsiveness, or interactions separately by profile; common functionality remains usable where expected.

#### 4.2. Handle direct routes and invalid product routes

**File:** `tests/resilience/direct-navigation.spec.ts`

**Steps:**
  1. In a fresh logged-out context, open cart, inventory, checkout, and completion URLs directly; then sign in and try a product detail URL with a missing or invalid product id.
    - expect: Authentication requirements are enforced on protected routes.
    - expect: Invalid product identifiers do not show misleading product details or crash the application; recovery navigation remains available.

#### 4.3. Check responsive layout, keyboard use, and accessible controls

**File:** `tests/usability/responsive-and-accessibility.spec.ts`

**Steps:**
  1. At desktop, tablet, and narrow mobile viewport sizes, inspect login, inventory, product detail, cart, checkout, and completion pages.
    - expect: Content and controls remain visible and usable without unintended overlap, clipping, or horizontal scrolling that blocks key actions.
  2. Navigate primary flows using keyboard only; inspect accessible names for inputs, buttons, product images, errors, and page landmarks.
    - expect: Controls are keyboard reachable and operable, focus is visible and logical, and assistive technology can identify form errors and key controls.
