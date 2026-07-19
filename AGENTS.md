# Workspace Automation Notes

## Resolved Windows npm command conflict

On 2026-07-19, PowerShell resolved `npm` to a zero-byte file at
`C:\Windows\System32\npm` before it reached Node.js. The invalid file has
since been removed, and `npm` now resolves to `D:\app\NodeJS\npm.ps1`.

For project imports, direct Node commands remain the fastest path:

```powershell
node scripts/add-project.mjs --check
node scripts/add-project.mjs --input ".project-intake.json" --images "C:\path\to\posters"
npm.cmd run build
npm.cmd run test:e2e
```

For routine project additions, use the direct Node commands and run only the
project manifest check. Run a full build or Playwright tests only when
publishing or when the change affects shared site behavior.

If an npm command ever hangs without output, run `Get-Command npm -All`
before retrying it.
