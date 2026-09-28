# Bug Report

## Bug 1: Pagination Logic Skips the First Page
* **Expected behavior:** When requesting `GET /tasks?page=1&limit=10`, the API should return the first 10 items (index 0 to 9).
* **Actual behavior:** It calculates `offset = page * limit`, which evaluates to `1 * 10 = 10`. Thus, page 1 returns items starting from index 10 (which is the *second* page). The first 10 items are effectively skipped unless page is 0.
* **How I discovered it:** Upon reviewing `taskService.js` `getPaginated` function and writing pagination tests, I realized that passing `page = 1` yields the second chunk of elements.
* **Fix needed:** Change the offset calculation in `src/services/taskService.js` to `const offset = (page - 1) * limit;`.

## Bug 2: `getByStatus` matches substring instead of exact string
* **Expected behavior:** `GET /tasks?status=in_progress` should return exactly tasks with the status 'in_progress'. 
* **Actual behavior:** The function uses `t.status.includes(status)`. Calling `GET /tasks?status=in` incorrectly matches 'in_progress'. 
* **How I discovered it:** While writing the unit tests for `taskService.getByStatus`, passing a substring matched a wider set of statuses than expected.
* **Fix needed:** Change `t.status.includes(status)` to `t.status === status`.

## Bug 3: `update` allows modifying immutable fields
* **Expected behavior:** Using `PUT /tasks/:id` to update a task should only update mutable fields (e.g. title, description, status) and should not allow modifying `id`, `createdAt`, or other internal fields.
* **Actual behavior:** `update` performs a simple object spread `{ ...tasks[index], ...fields }`. A client can overwrite the task's `id`.
* **How I discovered it:** Code review of `taskService.js` `update` function.
* **Fix needed:** Pick only allowed fields from the request body or reassign immutable fields after spreading.