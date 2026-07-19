# Workspace Automation Notes

## Windows npm command conflict

Do not invoke bare `npm` in this workspace.

On this machine, PowerShell resolves `npm` to the zero-byte file
`C:\Windows\System32\npm` before it reaches Node.js. This can make commands
wait until the tool timeout without producing output.

Use one of these forms instead:

```powershell
node scripts/add-project.mjs --check
node scripts/add-project.mjs --input ".project-intake.json" --images "C:\path\to\posters"
npm.cmd run build
npm.cmd run test:e2e
```

For routine project additions, use the direct Node commands and run only the
project manifest check. Run a full build or Playwright tests only when
publishing or when the change affects shared site behavior.
