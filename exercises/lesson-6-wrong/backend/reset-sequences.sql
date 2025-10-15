-- Reset sequences to the correct values based on current max IDs

-- Reset User sequence
SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE((SELECT MAX(id) FROM "User"), 0) + 1, false);

-- Reset Expense sequence
SELECT setval(pg_get_serial_sequence('"Expense"', 'id'), COALESCE((SELECT MAX(id) FROM "Expense"), 0) + 1, false);

-- Reset Transfer sequence
SELECT setval(pg_get_serial_sequence('"Transfer"', 'id'), COALESCE((SELECT MAX(id) FROM "Transfer"), 0) + 1, false);
