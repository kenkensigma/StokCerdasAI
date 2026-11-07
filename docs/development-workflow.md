# Development Workflow — StokCerdas AI

## 1. Work in Small Vertical Slices
Build one complete user workflow at a time. Avoid generating the entire application in one prompt.

Recommended slices:
1. App shell and design tokens.
2. Supabase setup and migrations.
3. Authentication and store provisioning.
4. Product CRUD.
5. Inventory list and stock movements.
6. Sales form and atomic stock deduction.
7. Inventory calculation module.
8. AI analysis.
9. Reports and final polish.

## 2. Before Starting a Task
- Read the relevant specification.
- Inspect existing code and migrations.
- Identify affected routes, components, services, and tables.
- Write acceptance criteria.
- Check whether the task changes permissions or data invariants.

## 3. During Implementation
- Keep changes focused.
- Reuse existing components.
- Add Zod schemas for external input.
- Keep business logic in service/calculation modules.
- Add database migrations for schema changes.
- Add tests for important business rules.
- Do not create placeholder buttons that look functional.

## 4. After Implementation
Run the scripts that exist in `package.json`, ideally:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

If a script does not exist, do not claim it was run. Report the actual checks performed.

## 5. Git Workflow
Use descriptive commits, for example:
- `feat(auth): add owner registration`
- `feat(products): implement product CRUD`
- `feat(sales): add atomic multi-item sales`
- `feat(ai): add inventory insight generation`
- `fix(inventory): prevent negative stock`
- `docs: update API contract`

Do not commit:
- `.env.local`
- API keys
- service-role credentials
- production customer data
- database dumps containing private information

## 6. Suggested AI Coding Prompt Template

```text
Read AGENTS.md, PROJECT_SPEC.md, and the relevant documents in docs/.

Task:
[Describe one specific feature.]

Acceptance criteria:
- [Observable requirement 1]
- [Observable requirement 2]
- [Observable requirement 3]

Constraints:
- Follow existing architecture and conventions.
- Do not modify unrelated features.
- Keep business logic on the server.
- Validate inputs with Zod.
- Enforce store membership and role permissions.
- Add/update tests.
- Do not use mock data in production paths.
- Do not expose secrets.

Before editing, inspect the existing implementation and explain the plan.
After editing, run relevant checks and summarize changed files, tests, and remaining issues.
```

## 7. Definition of Done
A feature is complete only when it works end-to-end, handles errors, respects permissions, has appropriate tests, and matches the design system.
