# One Folk Cafe Desktop Test Cases

Run the app from `desktop-app` with `npm.cmd run tauri:dev`. Use a fresh database only when a test says so. Default login is `admin` / `admin123`.

## Test Data

- Existing category: `Coffee`
- Existing product: `Cappuccino`, full `120`, half `80`
- Existing table: `T1`
- New category: `Test Drinks`
- New product: `Test Mocha`, full `100`, half `60`
- Customer: `Test Customer`, mobile `9990000001`

## Authentication

| ID | Action | Expected |
|---|---|---|
| AUTH-01 | Log in with `admin` / `admin123` | Dashboard opens and token is stored locally |
| AUTH-02 | Log in with an incorrect password | Login is rejected; no dashboard access |
| AUTH-03 | Restart app after successful login | Session is restored or login page appears without a crash |
| AUTH-04 | Log out | Session is cleared and login page opens |

## Categories

| ID | Action | Expected |
|---|---|---|
| CAT-01 | Open Products and load categories | Existing categories appear |
| CAT-02 | Add `Test Drinks` | Category appears and can be selected |
| CAT-03 | Add a category with an image | Category is saved with its image reference |
| CAT-04 | Rename `Test Drinks` | New name appears in category lists |
| CAT-05 | Try to create a duplicate category name | Conflict error is shown |
| CAT-06 | Try to delete a category containing products | Delete is rejected |
| CAT-07 | Delete an unused category | Category is removed |

## Products

| ID | Action | Expected |
|---|---|---|
| PROD-01 | Load Products page | Existing products load with prices and categories |
| PROD-02 | Add `Test Mocha`, category `Test Drinks`, full price `100`, no half price | Product is created and displays full price `100` |
| PROD-03 | Add product with full `100`, half enabled, half price `60` | Product displays full `100` and half `60` |
| PROD-04 | Add product with an uploaded image | Product is saved and image preview/reference remains after reload |
| PROD-05 | Add product with an image URL | URL is saved and image displays |
| PROD-06 | Toggle product availability off and on | Status changes and persists after reload |
| PROD-07 | Edit product name, category, prices, description, and image | All changes persist |
| PROD-08 | Delete a product | Product disappears from active list |
| PROD-09 | Submit blank name or zero/invalid price | Validation error; no row is inserted |
| PROD-10 | Reload Products after adding an integer-looking price such as `100` | No `f64`/`INTEGER` decoding error; price displays correctly |

## Tables

| ID | Action | Expected |
|---|---|---|
| TABLE-01 | Load Tables page | T1-T6 appear as available |
| TABLE-02 | Add table `T7`, capacity `4` | T7 appears as available |
| TABLE-03 | Edit T7 capacity/status | Changes persist |
| TABLE-04 | Set T7 to Occupied, Reserved, Maintenance, Available | Each valid status is accepted |
| TABLE-05 | Try duplicate table number | Conflict error is shown |
| TABLE-06 | Delete an unused table | Table is removed |

## Customers

| ID | Action | Expected |
|---|---|---|
| CUST-01 | Load Customers page | Customer list loads |
| CUST-02 | Add Test Customer with mobile `9990000001` | Customer is created |
| CUST-03 | Add the same mobile again | Duplicate conflict is shown |
| CUST-04 | Create an order for an existing mobile with a new name | Existing customer is reused, not duplicated |

## Orders and Billing Math

| ID | Action | Expected |
|---|---|---|
| ORD-01 | Create order: Cappuccino full x2 | Total is `240`; status Pending; payment Unpaid |
| ORD-02 | Create order: Cappuccino half x2 | Total is `160` |
| ORD-03 | Create order: Cappuccino full x2 plus half x1 | Total is `320` |
| ORD-04 | Create order for customer and table T1 | Customer is attached and T1 becomes Occupied |
| ORD-05 | Create takeaway order without customer/table | Order succeeds and table statuses remain unchanged |
| ORD-06 | Try unavailable product | Order is rejected and no partial order remains |
| ORD-07 | Try half serving for a product without half price | Order is rejected |
| ORD-08 | Update order items from full x2 to half x1 | Total changes from `240` to `80` |
| ORD-09 | Change order table | New table is stored |
| ORD-10 | Move order Pending -> Preparing -> Ready -> Completed | Every valid status works; completed table becomes Available |
| ORD-11 | Cancel an active table order | Order becomes Cancelled and table becomes Available |
| ORD-12 | Try invalid order status | Validation error is shown |
| ORD-13 | Mark order Paid with cash/card | Payment status and method persist; paid time is set |
| ORD-14 | Mark order Partial or Refunded | Status persists |
| ORD-15 | Try invalid payment status | Validation error is shown |
| ORD-16 | Filter orders by status/payment/table/date | Results match the filter and pagination totals |
| ORD-17 | Delete an order | Order and its items are removed; table becomes Available |
| ORD-18 | Reload Orders after totals such as `240` or `320` | No `f64`/`INTEGER` decoding error |

## Notifications

| ID | Action | Expected |
|---|---|---|
| NOTIF-01 | Create an order | New-order notification appears |
| NOTIF-02 | Change order status | Status-change notification appears |
| NOTIF-03 | Change payment status | Payment notification appears |
| NOTIF-04 | Mark one notification read | It is marked read |
| NOTIF-05 | Mark all notifications read | All visible notifications are read |

## Dashboard and Revenue

Use ORD-01 and ORD-13 first so the order is Paid.

| ID | Action | Expected |
|---|---|---|
| ANALYTICS-01 | Open Dashboard monthly view | Metrics load without numeric decode errors |
| ANALYTICS-02 | Check total orders/customers/products | Counts match stored records |
| ANALYTICS-03 | Check paid revenue for one order of `240` | Total revenue increases by `240` |
| ANALYTICS-04 | Check average order value | Paid revenue divided by dashboard order count is shown according to the current implementation |
| ANALYTICS-05 | Open Top Products | Quantity and revenue match order items |
| ANALYTICS-06 | Open Top Categories | Quantity and revenue match category totals |
| ANALYTICS-07 | Open Sales Report daily/weekly/monthly | Paid totals are grouped under the correct date period |
| ANALYTICS-08 | Reload dashboard after integer-looking totals | No `f64`/`INTEGER` decoding error |

## Settings and Images

| ID | Action | Expected |
|---|---|---|
| SET-01 | Load Settings | Existing cafe settings appear |
| SET-02 | Change cafe name, address, phone, email, hours, description | Values persist after reload |
| SET-03 | Upload logo/banner/story/gallery image | Upload succeeds and image reference is stored |
| SET-04 | Set featured products/gallery items | JSON-backed settings persist and reload |
| SET-05 | Change password, log out, log in with new password | New password works; old password fails |

## File Operations

| ID | Action | Expected |
|---|---|---|
| FILE-01 | Save an image from the product flow | File exists under the app data uploads folder |
| FILE-02 | Delete the saved image | File is removed; repeated delete is harmless |
| FILE-03 | Upload invalid base64 data through the command path | A readable base64 error is returned |

## Automated Checks

From the repository root:

```powershell
& 'C:\Users\Roshan\.cargo\bin\cargo.exe' check --manifest-path '.\desktop-app\src-tauri\Cargo.toml'
& 'C:\Users\Roshan\.cargo\bin\cargo.exe' test --manifest-path '.\desktop-app\src-tauri\Cargo.toml'
& 'C:\Program Files\nodejs\npm.cmd' --prefix '.\desktop-app' run build
```

The automated suite currently contains no Rust integration tests, so the table above is the manual acceptance suite. Record each result as PASS/FAIL with the exact error text and the test ID.
