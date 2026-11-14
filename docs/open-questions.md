# Open questions

Do not infer answers from the current prototype.

1. Which storage technology should be selected first: local MySQL, another database, or another approach? **Resolved: AWS RDS MySQL 8.4 for the MVP.**
2. Which authentication service should support accounts?
3. Is account support needed for the judged demo or after it? **Resolved: temporary single owner for the first working unit; accounts remain high-priority stretch.**
4. What auth identity value will own a contact?
5. Should raw AI input/output be stored, and for how long?
6. Does the 30-day timer start after contact update, note creation, or processing? **Provisional: source creation; confirm with the team later.**
7. Are transcripts and recordings both retained for 30 days?
8. What backup-retention and backup-deletion behavior is acceptable?
9. What audio format, maximum size, and upload/storage path are required?
10. What duplicate-contact and merge behavior should storage support? **Resolved: duplicates allowed; merging only after explicit confirmation.**
11. Should deletion be soft or immediate, and how long may deleted data remain recoverable?
12. What database-facing REST contract will the JS/API owners accept? **Initial MVP contract is documented in `database-contract.md`; review with the JS/API owners.**
13. Who owns the API route layer between the browser, AI code, and database?
14. Which test runner and disposable test-database strategy will the team use?
15. Which AWS service, if any, is acceptable for the stretch goal?
16. What encryption is required at rest and in transit?
17. How will application authorization prevent one account reading another account's contacts?
18. What data may appear in logs, temporary files, failed requests, or error reports?
19. How will deletion apply to AI-provider copies and database backups?
20. Can consent be withdrawn, and does a changed policy require re-consent?
