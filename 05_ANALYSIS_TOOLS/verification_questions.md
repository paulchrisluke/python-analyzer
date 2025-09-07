# DueDiligenceManager Verification Questions

## Schema Compliance Questions:
1. Does every document in every category include all required fields (`name`, `status`, `notes`, `due_date`, `file_type`, `file_path`, `file_size`, `visibility`)?
2. Are the field types correct (bool for status, string for file_size, list for visibility)?
3. Do equipment items include the `value` field?

## Stage Filtering Questions:
4. Does `get_stage_view("public")` correctly hide file paths and only show high-level stats?
5. Does `get_stage_view("nda")` show category completeness and NDA docs but hide file paths?
6. Does `get_stage_view("buyer")` show doc availability but hide file paths?
7. Does `get_stage_view("closing")` only show milestones?
8. Does `get_stage_view("internal")` expose everything, including file paths and sizes?

## Functionality Questions:
9. Does `check_filesystem()` actually detect files and update `status` and `file_size`?
10. Does `validate()` properly flag missing critical docs (like P&L, leases)?
11. Does `calculate_scores()` return proper weighted scores and recommendations?
12. Does `export_all()` create 5 stage-specific JSON files in the correct location?
13. Do all exported JSONs match the master schema?

## Edge Cases:
14. What happens with invalid stage names?
15. What happens with empty document categories?
16. What happens when files don't exist vs when they do exist?
17. Are file sizes calculated correctly for different file types?

## Integration Questions:
18. Does the ETL pipeline integration work correctly?
19. Does standalone mode work without full pipeline?
20. Are the command-line options working?
